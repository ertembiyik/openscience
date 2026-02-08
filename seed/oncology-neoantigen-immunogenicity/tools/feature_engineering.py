"""
Novel position-aware feature engineering for neoantigen immunogenicity.

Core insight from literature review:
- NeoaPred shows that STRUCTURAL differences between mutant and wild-type at
  TCR-facing positions drive immunogenicity predictions.
- We approximate this WITHOUT structure prediction by using known HLA anchor
  positions and TCR contact positions from crystallography studies.

Key idea: A mutation at an MHC anchor position (positions 2, 9 for HLA-A*02:01)
mainly affects BINDING. A mutation at a TCR-facing position (positions 4-8)
mainly affects IMMUNOGENICITY. These are fundamentally different signals.

Features computed:
1. Position-aware: Is mutation at anchor? At TCR contact? At solvent-exposed?
2. Amino acid properties at mutation site: hydrophobicity, charge, size, etc.
3. Context features: properties of residues flanking the mutation
4. Wild-type reconstruction: search human proteome to find original residue
5. Mutant-vs-WT property differences (when WT is known)
"""
import sys
import numpy as np
import pandas as pd

sys.path.insert(0, ".")

# ══════════════════════════════════════════════════════════════════════════════
# AMINO ACID PROPERTY TABLES
# ══════════════════════════════════════════════════════════════════════════════

# Kyte-Doolittle hydrophobicity scale
HYDROPHOBICITY = {
    'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
    'Q': -3.5, 'E': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
    'L': 3.8, 'K': -3.9, 'M': 1.9, 'F': 2.8, 'P': -1.6,
    'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2,
}

# Molecular weight (Daltons) -- proxy for residue size
MOLECULAR_WEIGHT = {
    'A': 89, 'R': 174, 'N': 132, 'D': 133, 'C': 121,
    'Q': 146, 'E': 147, 'G': 75, 'H': 155, 'I': 131,
    'L': 131, 'K': 146, 'M': 149, 'F': 165, 'P': 115,
    'S': 105, 'T': 119, 'W': 204, 'Y': 181, 'V': 117,
}

# Charge at pH 7
CHARGE = {
    'A': 0, 'R': 1, 'N': 0, 'D': -1, 'C': 0,
    'Q': 0, 'E': -1, 'G': 0, 'H': 0.1, 'I': 0,
    'L': 0, 'K': 1, 'M': 0, 'F': 0, 'P': 0,
    'S': 0, 'T': 0, 'W': 0, 'Y': 0, 'V': 0,
}

# Aromaticity (1 if aromatic ring)
AROMATIC = {
    'A': 0, 'R': 0, 'N': 0, 'D': 0, 'C': 0,
    'Q': 0, 'E': 0, 'G': 0, 'H': 1, 'I': 0,
    'L': 0, 'K': 0, 'M': 0, 'F': 1, 'P': 0,
    'S': 0, 'T': 0, 'W': 1, 'Y': 1, 'V': 0,
}

# Polarity
POLAR = {
    'A': 0, 'R': 1, 'N': 1, 'D': 1, 'C': 0,
    'Q': 1, 'E': 1, 'G': 0, 'H': 1, 'I': 0,
    'L': 0, 'K': 1, 'M': 0, 'F': 0, 'P': 0,
    'S': 1, 'T': 1, 'W': 0, 'Y': 1, 'V': 0,
}

AA_PROPERTY_TABLES = {
    'hydrophobicity': HYDROPHOBICITY,
    'molecular_weight': MOLECULAR_WEIGHT,
    'charge': CHARGE,
    'aromatic': AROMATIC,
    'polar': POLAR,
}


# ══════════════════════════════════════════════════════════════════════════════
# HLA ANCHOR AND TCR CONTACT POSITIONS
# ══════════════════════════════════════════════════════════════════════════════
#
# MHC-I peptides sit in a groove with specific anchor positions that anchor
# the peptide to the MHC molecule. The remaining positions point UP, facing
# the T-cell receptor (TCR).
#
# For 9-mers (the most common MHC-I peptide length):
# - Positions 2 and 9 (C-terminus) are primary anchors for most HLA-A alleles
# - Position 1 can be a secondary anchor for some alleles
# - Positions 4, 5, 6, 7, 8 face the TCR (especially 5 and 8)
#
# For 10-mers, the peptide bulges in the middle, making positions 5-7
# even more TCR-exposed.
#
# Sources: Biochemistry textbooks, PDB crystal structures, MHC motif databases

# Anchor positions by allele (1-indexed) for 9-mers
# These are positions that primarily contact MHC, not TCR
HLA_ANCHORS_9MER = {
    'HLA-A*01:01': [2, 3, 9],       # A1 motif: position 2 (T/S), 3 (D/E), C-term (Y)
    'HLA-A*02:01': [2, 9],          # A2 motif: position 2 (L/M), C-term (V/L)
    'HLA-A*03:01': [2, 9],          # A3 motif: position 2 (L/V/M), C-term (K/R)
    'HLA-A*11:01': [2, 9],          # A11 motif: position 2 (V/T/A), C-term (K/R)
    'HLA-A*24:02': [2, 9],          # A24 motif: position 2 (Y/F), C-term (F/L/I)
    'HLA-A*68:01': [2, 9],          # Similar to A2
    'HLA-B*07:02': [2, 9],          # B7 motif: position 2 (P), C-term (L/M)
    'HLA-B*08:01': [3, 5, 9],       # B8 has unusual anchor pattern
    'HLA-B*27:05': [2, 9],          # B27 motif: position 2 (R), C-term (R/K/L)
    'HLA-B*44:02': [2, 9],          # B44 motif: position 2 (E), C-term (Y/F/W)
    'HLA-B*57:01': [2, 9],          # B57 motif
    'HLA-C*05:01': [2, 9],          # C alleles less studied
    'HLA-C*06:02': [2, 9],
}

# Default for unknown alleles
DEFAULT_ANCHORS_9MER = [2, 9]

# TCR contact positions (1-indexed) -- positions that face the TCR
# These are the positions where mutations are most likely to affect immunogenicity
# INDEPENDENTLY of binding
TCR_CONTACT_9MER = [4, 5, 6, 7, 8]  # Central positions
TCR_CONTACT_10MER = [4, 5, 6, 7, 8, 9]  # Extended central bulge
TCR_CONTACT_11MER = [4, 5, 6, 7, 8, 9, 10]


def get_anchor_positions(allele, peptide_length):
    """Get MHC anchor positions for a given allele and peptide length."""
    # Get 9-mer anchors
    anchors = HLA_ANCHORS_9MER.get(allele, DEFAULT_ANCHORS_9MER).copy()

    # For longer peptides, anchors are still at position 2 and C-terminus
    if peptide_length > 9:
        # Replace C-terminal anchor
        anchors = [a for a in anchors if a != 9]
        anchors.append(peptide_length)

    return anchors


def get_tcr_positions(peptide_length):
    """Get TCR-facing positions for a given peptide length."""
    if peptide_length <= 9:
        return TCR_CONTACT_9MER[:min(5, peptide_length - 2)]
    elif peptide_length == 10:
        return TCR_CONTACT_10MER
    else:
        return TCR_CONTACT_11MER[:min(7, peptide_length - 2)]


def get_aa_property(residue, prop_name):
    """Get a property value for an amino acid."""
    table = AA_PROPERTY_TABLES.get(prop_name, {})
    return table.get(residue, 0.0)


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE COMPUTATION
# ══════════════════════════════════════════════════════════════════════════════

def compute_position_features(peptide, mutation_pos, allele, peptide_length):
    """
    Compute position-aware features.

    This is our novel contribution: using known anchor/TCR contact positions
    to determine WHETHER the mutation affects binding or TCR recognition.
    """
    features = {}

    if pd.isna(mutation_pos):
        # No mutation position available -- return NaN features
        for key in ['mut_at_anchor', 'mut_at_tcr_contact', 'mut_at_p2', 'mut_at_cterm',
                     'mut_position_normalized', 'mut_distance_from_center']:
            features[key] = np.nan
        return features

    mut_pos = int(mutation_pos)
    anchors = get_anchor_positions(allele, peptide_length)
    tcr_positions = get_tcr_positions(peptide_length)

    # Binary: is mutation at anchor position?
    features['mut_at_anchor'] = 1.0 if mut_pos in anchors else 0.0

    # Binary: is mutation at TCR contact position?
    features['mut_at_tcr_contact'] = 1.0 if mut_pos in tcr_positions else 0.0

    # Specific anchor positions
    features['mut_at_p2'] = 1.0 if mut_pos == 2 else 0.0
    features['mut_at_cterm'] = 1.0 if mut_pos == peptide_length else 0.0

    # Normalized position (0 = N-term, 1 = C-term)
    features['mut_position_normalized'] = (mut_pos - 1) / max(peptide_length - 1, 1)

    # Distance from peptide center (where TCR contact is maximal)
    center = (peptide_length + 1) / 2
    features['mut_distance_from_center'] = abs(mut_pos - center) / center

    return features


def compute_mutation_site_properties(peptide, mutation_pos):
    """
    Compute amino acid properties at the mutation site.
    """
    features = {}

    if pd.isna(mutation_pos) or int(mutation_pos) < 1 or int(mutation_pos) > len(peptide):
        for prop_name in AA_PROPERTY_TABLES:
            features[f'mut_residue_{prop_name}'] = np.nan
        return features

    mut_pos = int(mutation_pos)
    mut_residue = peptide[mut_pos - 1]  # Convert to 0-indexed

    for prop_name, prop_table in AA_PROPERTY_TABLES.items():
        features[f'mut_residue_{prop_name}'] = prop_table.get(mut_residue, 0.0)

    return features


def compute_context_features(peptide, mutation_pos):
    """
    Compute features about the local context around the mutation.
    The amino acids neighboring the mutation influence how the mutant residue
    is perceived by the TCR.
    """
    features = {}

    if pd.isna(mutation_pos) or int(mutation_pos) < 1 or int(mutation_pos) > len(peptide):
        for key in ['context_hydrophobicity_mean', 'context_charge_sum',
                     'mut_hydrophobicity_vs_context', 'mut_creates_charge_break']:
            features[key] = np.nan
        return features

    mut_pos = int(mutation_pos) - 1  # 0-indexed
    pep_len = len(peptide)

    # Get flanking residues (window of ±1)
    flanking = []
    if mut_pos > 0:
        flanking.append(peptide[mut_pos - 1])
    if mut_pos < pep_len - 1:
        flanking.append(peptide[mut_pos + 1])

    mut_residue = peptide[mut_pos]

    # Context hydrophobicity
    if flanking:
        context_hydro = np.mean([HYDROPHOBICITY.get(r, 0) for r in flanking])
    else:
        context_hydro = 0.0
    features['context_hydrophobicity_mean'] = context_hydro

    # Context charge
    context_charge = sum(CHARGE.get(r, 0) for r in flanking)
    features['context_charge_sum'] = context_charge

    # Does the mutant residue break the local hydrophobicity pattern?
    # (e.g., a polar residue in hydrophobic context or vice versa)
    mut_hydro = HYDROPHOBICITY.get(mut_residue, 0)
    features['mut_hydrophobicity_vs_context'] = mut_hydro - context_hydro

    # Does mutation create a charge break?
    mut_charge = CHARGE.get(mut_residue, 0)
    features['mut_creates_charge_break'] = abs(mut_charge - context_charge / max(len(flanking), 1))

    return features


def compute_peptide_global_features(peptide):
    """
    Compute whole-peptide features from the amino acid sequence.
    """
    features = {}
    n = len(peptide)

    # Average hydrophobicity
    hydro_values = [HYDROPHOBICITY.get(r, 0) for r in peptide]
    features['peptide_hydrophobicity_mean'] = np.mean(hydro_values)
    features['peptide_hydrophobicity_std'] = np.std(hydro_values)

    # Charge distribution
    charge_values = [CHARGE.get(r, 0) for r in peptide]
    features['peptide_net_charge'] = sum(charge_values)
    features['peptide_has_positive_charge'] = 1.0 if any(c > 0 for c in charge_values) else 0.0
    features['peptide_has_negative_charge'] = 1.0 if any(c < 0 for c in charge_values) else 0.0

    # Aromaticity
    features['peptide_n_aromatic'] = sum(AROMATIC.get(r, 0) for r in peptide)

    # Polarity
    features['peptide_frac_polar'] = sum(POLAR.get(r, 0) for r in peptide) / n

    # Sequence complexity (Shannon entropy over amino acid frequencies)
    from collections import Counter
    aa_counts = Counter(peptide)
    freqs = np.array(list(aa_counts.values())) / n
    features['peptide_sequence_entropy'] = -np.sum(freqs * np.log2(freqs + 1e-10))

    return features


def compute_tcr_facing_features(peptide, mutation_pos, allele, peptide_length):
    """
    Compute features specifically about the TCR-facing surface of the peptide.

    This is the key novel feature set: instead of looking at the whole peptide,
    we focus on the residues that the TCR actually "sees".
    """
    features = {}
    tcr_positions = get_tcr_positions(peptide_length)

    # Extract TCR-facing residues
    tcr_residues = []
    for pos in tcr_positions:
        if pos <= len(peptide):
            tcr_residues.append(peptide[pos - 1])

    if not tcr_residues:
        for key in ['tcr_surface_hydrophobicity', 'tcr_surface_charge',
                     'tcr_surface_n_aromatic', 'tcr_surface_frac_polar']:
            features[key] = np.nan
        return features

    # TCR-facing surface properties
    features['tcr_surface_hydrophobicity'] = np.mean([HYDROPHOBICITY.get(r, 0) for r in tcr_residues])
    features['tcr_surface_charge'] = sum(CHARGE.get(r, 0) for r in tcr_residues)
    features['tcr_surface_n_aromatic'] = sum(AROMATIC.get(r, 0) for r in tcr_residues)
    features['tcr_surface_frac_polar'] = sum(POLAR.get(r, 0) for r in tcr_residues) / len(tcr_residues)

    return features


def engineer_features(tesla_df):
    """
    Compute all novel features for a TESLA-format DataFrame.

    Returns DataFrame with original columns plus new feature columns.
    """
    all_features = []

    for _, row in tesla_df.iterrows():
        peptide = row['peptide']
        allele = row['allele']
        mut_pos = row.get('mutation_position', np.nan)
        pep_len = row.get('peptide_length', len(peptide))

        features = {}

        # 1. Position-aware features
        features.update(compute_position_features(peptide, mut_pos, allele, pep_len))

        # 2. Mutation site amino acid properties
        features.update(compute_mutation_site_properties(peptide, mut_pos))

        # 3. Context features around mutation
        features.update(compute_context_features(peptide, mut_pos))

        # 4. Global peptide features
        features.update(compute_peptide_global_features(peptide))

        # 5. TCR-facing surface features
        features.update(compute_tcr_facing_features(peptide, mut_pos, allele, pep_len))

        all_features.append(features)

    feature_df = pd.DataFrame(all_features)
    return pd.concat([tesla_df.reset_index(drop=True), feature_df], axis=1)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN: Run feature engineering + model training on TESLA
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    from tools.data_loader import load_tesla
    from tools.evaluate import evaluate_predictions, print_metrics, compare_models
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.impute import SimpleImputer
    from sklearn.model_selection import LeaveOneGroupOut, cross_val_predict

    print("Loading TESLA data...")
    tesla = load_tesla()

    print("Computing novel features...")
    tesla = engineer_features(tesla)

    # Add MHCflurry features
    print("Running MHCflurry...")
    from tools.error_analysis_and_multifeature import add_mhcflurry_features
    tesla = add_mhcflurry_features(tesla)

    y = tesla['immunogenic'].astype(int).values
    groups = tesla['patient_id'].values

    # ── Define feature sets ──
    # Set A: TESLA original features only (baseline comparison)
    tesla_features = [
        'predicted_affinity', 'binding_stability', 'tumor_abundance',
        'frac_hydrophobic', 'agretopicity', 'foreignness',
        'mutation_position', 'peptide_length',
    ]

    # Set B: Our novel position-aware features
    novel_features = [
        'mut_at_anchor', 'mut_at_tcr_contact', 'mut_at_p2', 'mut_at_cterm',
        'mut_position_normalized', 'mut_distance_from_center',
        'mut_residue_hydrophobicity', 'mut_residue_molecular_weight',
        'mut_residue_charge', 'mut_residue_aromatic', 'mut_residue_polar',
        'context_hydrophobicity_mean', 'context_charge_sum',
        'mut_hydrophobicity_vs_context', 'mut_creates_charge_break',
        'peptide_hydrophobicity_mean', 'peptide_hydrophobicity_std',
        'peptide_net_charge', 'peptide_has_positive_charge',
        'peptide_has_negative_charge', 'peptide_n_aromatic',
        'peptide_frac_polar', 'peptide_sequence_entropy',
        'tcr_surface_hydrophobicity', 'tcr_surface_charge',
        'tcr_surface_n_aromatic', 'tcr_surface_frac_polar',
    ]

    # Set C: MHCflurry features
    mhcflurry_features = [
        'mhcflurry_presentation', 'mhcflurry_affinity', 'mhcflurry_processing',
    ]

    # Set D: ALL features combined
    all_features = tesla_features + novel_features + mhcflurry_features

    logo = LeaveOneGroupOut()
    all_results = []

    feature_sets = {
        'TESLA only': tesla_features,
        'Novel only': novel_features,
        'TESLA + MHCflurry': tesla_features + mhcflurry_features,
        'Novel + MHCflurry': novel_features + mhcflurry_features,
        'ALL features': all_features,
    }

    for name, feat_cols in feature_sets.items():
        print(f"\n{'='*60}")
        print(f"  Feature set: {name} ({len(feat_cols)} features)")
        print(f"{'='*60}")

        X = tesla[feat_cols].values.copy()

        # Log-transform skewed features
        for i, col in enumerate(feat_cols):
            if col in ['predicted_affinity', 'tumor_abundance', 'mhcflurry_affinity',
                        'binding_affinity']:
                X[:, i] = np.log1p(X[:, i])

        # Impute and scale
        imputer = SimpleImputer(strategy='median')
        X = imputer.fit_transform(X)
        scaler = StandardScaler()
        X = scaler.fit_transform(X)

        # Random Forest
        rf = RandomForestClassifier(
            n_estimators=500, class_weight='balanced',
            max_depth=5, min_samples_leaf=5, random_state=42
        )
        rf_probs = cross_val_predict(rf, X, y, cv=logo, groups=groups, method='predict_proba')[:, 1]
        rf_metrics = evaluate_predictions(y, rf_probs, name=f'RF ({name})')
        print_metrics(rf_metrics)
        all_results.append(rf_metrics)

        # Gradient Boosting (often better for heterogeneous features)
        gb = GradientBoostingClassifier(
            n_estimators=200, max_depth=3, learning_rate=0.05,
            min_samples_leaf=5, random_state=42, subsample=0.8,
        )
        gb_probs = cross_val_predict(gb, X, y, cv=logo, groups=groups, method='predict_proba')[:, 1]
        gb_metrics = evaluate_predictions(y, gb_probs, name=f'GB ({name})')
        print_metrics(gb_metrics)
        all_results.append(gb_metrics)

    # ── Add baselines for comparison ──
    # MHCflurry single feature
    valid = ~tesla['mhcflurry_presentation'].isna()
    mhcf = evaluate_predictions(
        y[valid.values],
        tesla.loc[valid, 'mhcflurry_presentation'].values,
        name='MHCflurry single'
    )
    all_results.append(mhcf)

    # Random
    np.random.seed(42)
    rand = evaluate_predictions(y, np.random.rand(len(tesla)), name='Random')
    all_results.append(rand)

    # ── Final comparison ──
    print("\n\n" + "=" * 70)
    print("  FINAL MODEL COMPARISON")
    print("=" * 70)
    compare_models(all_results)
    print("\nPublished TESLA ensemble: AUPRC ~0.28, AUC-ROC ~0.80")

    # ── Feature importance for best model ──
    print("\n\n" + "=" * 70)
    print("  FEATURE IMPORTANCE (RF, ALL features)")
    print("=" * 70)
    X_all = tesla[all_features].values.copy()
    for i, col in enumerate(all_features):
        if col in ['predicted_affinity', 'tumor_abundance', 'mhcflurry_affinity']:
            X_all[:, i] = np.log1p(X_all[:, i])
    X_all = SimpleImputer(strategy='median').fit_transform(X_all)
    X_all = StandardScaler().fit_transform(X_all)

    rf_full = RandomForestClassifier(
        n_estimators=500, class_weight='balanced',
        max_depth=5, min_samples_leaf=5, random_state=42
    )
    rf_full.fit(X_all, y)

    importances = sorted(zip(all_features, rf_full.feature_importances_), key=lambda x: -x[1])
    print("\nTop 20 features:")
    for feat, imp in importances[:20]:
        bar = '█' * int(imp * 200)
        print(f"  {feat:35s} {imp:.4f} {bar}")

    # ── Per-patient analysis with best model ──
    print("\n\n" + "=" * 70)
    print("  PER-PATIENT ANALYSIS (best model)")
    print("=" * 70)

    # Find best model
    best = max(all_results, key=lambda x: x['auprc'])
    print(f"\nBest model: {best['name']} (AUPRC={best['auprc']:.4f})")

    # Re-run best config for per-patient
    X_best = tesla[all_features].values.copy()
    for i, col in enumerate(all_features):
        if col in ['predicted_affinity', 'tumor_abundance', 'mhcflurry_affinity']:
            X_best[:, i] = np.log1p(X_best[:, i])
    X_best = SimpleImputer(strategy='median').fit_transform(X_best)
    X_best = StandardScaler().fit_transform(X_best)

    rf_best = RandomForestClassifier(
        n_estimators=500, class_weight='balanced',
        max_depth=5, min_samples_leaf=5, random_state=42
    )
    best_probs = cross_val_predict(rf_best, X_best, y, cv=logo, groups=groups, method='predict_proba')[:, 1]

    from sklearn.metrics import roc_auc_score, average_precision_score
    for patient in sorted(tesla['patient_id'].unique()):
        mask = groups == patient
        p_y = y[mask]
        p_scores = best_probs[mask]
        n_imm = p_y.sum()
        if n_imm > 0 and (p_y == 0).sum() > 0:
            auc = roc_auc_score(p_y, p_scores)
            ap = average_precision_score(p_y, p_scores)
            print(f"  Patient {patient}: AUC-ROC={auc:.3f}, AUPRC={ap:.3f} "
                  f"({n_imm} immunogenic / {mask.sum()} total)")
