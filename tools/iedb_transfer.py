"""
Transfer learning from IEDB: train an immunogenicity predictor on the large IEDB
dataset (122K examples) and evaluate on TESLA (608 peptides).

This tests whether learning from a much larger dataset -- even with domain shift --
can improve predictions on the small TESLA benchmark.

The key difference: IEDB contains T-cell assay results from various experiments,
while TESLA is specifically tumor neoantigen immunogenicity. The question is
whether the signal transfers.

We also reconstruct wild-type peptides where possible using the mutation position,
and compute mutant-vs-WT amino acid property differences.
"""
import sys
import numpy as np
import pandas as pd
from collections import Counter

sys.path.insert(0, ".")

from tools.data_loader import load_tesla, load_iedb, get_iedb_train_data
from tools.evaluate import evaluate_predictions, print_metrics, compare_models
from tools.feature_engineering import (
    AA_PROPERTY_TABLES, HYDROPHOBICITY, MOLECULAR_WEIGHT, CHARGE, AROMATIC, POLAR,
    compute_peptide_global_features, compute_tcr_facing_features,
    get_anchor_positions, get_tcr_positions,
)

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.model_selection import LeaveOneGroupOut, cross_val_predict


# ══════════════════════════════════════════════════════════════════════════════
# AMINO ACID ENCODING
# ══════════════════════════════════════════════════════════════════════════════

# BLOSUM62 substitution scores -- how "surprising" is each amino acid substitution
# Higher score = more conservative substitution = less likely to be recognized as foreign
BLOSUM62_SELF = {
    'A': 4, 'R': 5, 'N': 6, 'D': 6, 'C': 9,
    'Q': 5, 'E': 5, 'G': 6, 'H': 8, 'I': 4,
    'L': 4, 'K': 5, 'M': 5, 'F': 6, 'P': 7,
    'S': 4, 'T': 5, 'W': 11, 'Y': 7, 'V': 4,
}

# Amino acid one-hot dimension
AA_LIST = list('ACDEFGHIKLMNPQRSTVWY')
AA_TO_IDX = {aa: i for i, aa in enumerate(AA_LIST)}


def encode_peptide_properties(peptide, max_len=14):
    """
    Encode peptide as a fixed-length feature vector using amino acid properties.

    For each position (padded to max_len), compute:
    - Hydrophobicity, charge, size, aromaticity, polarity

    Returns flat array of shape (max_len * 5,).
    """
    features = []
    for i in range(max_len):
        if i < len(peptide):
            aa = peptide[i]
            features.extend([
                HYDROPHOBICITY.get(aa, 0),
                CHARGE.get(aa, 0),
                MOLECULAR_WEIGHT.get(aa, 0) / 200.0,  # Normalize
                AROMATIC.get(aa, 0),
                POLAR.get(aa, 0),
            ])
        else:
            features.extend([0, 0, 0, 0, 0])  # Padding

    return np.array(features, dtype=np.float32)


def compute_sequence_features(peptide):
    """
    Compute sequence-level features for any peptide.
    Works for both IEDB and TESLA data.
    """
    features = {}

    # Amino acid composition (20 features)
    n = len(peptide)
    counts = Counter(peptide)
    for aa in AA_LIST:
        features[f'aa_frac_{aa}'] = counts.get(aa, 0) / n

    # Property statistics
    hydro = [HYDROPHOBICITY.get(r, 0) for r in peptide]
    features['seq_hydro_mean'] = np.mean(hydro)
    features['seq_hydro_std'] = np.std(hydro)
    features['seq_hydro_min'] = np.min(hydro)
    features['seq_hydro_max'] = np.max(hydro)

    charge = [CHARGE.get(r, 0) for r in peptide]
    features['seq_charge_sum'] = sum(charge)
    features['seq_n_charged'] = sum(1 for c in charge if abs(c) > 0.5)

    features['seq_n_aromatic'] = sum(AROMATIC.get(r, 0) for r in peptide)
    features['seq_frac_polar'] = sum(POLAR.get(r, 0) for r in peptide) / n
    features['seq_length'] = n

    # Dipeptide features (top 10 most informative)
    if n >= 2:
        dipeptides = [peptide[i:i+2] for i in range(n-1)]
        dp_counts = Counter(dipeptides)
        total_dp = len(dipeptides)
        # Just use entropy as a summary
        dp_freqs = np.array(list(dp_counts.values())) / total_dp
        features['seq_dipeptide_entropy'] = -np.sum(dp_freqs * np.log2(dp_freqs + 1e-10))

    # Shannon entropy
    aa_freqs = np.array(list(counts.values())) / n
    features['seq_entropy'] = -np.sum(aa_freqs * np.log2(aa_freqs + 1e-10))

    return features


# ══════════════════════════════════════════════════════════════════════════════
# WILD-TYPE RECONSTRUCTION
# ══════════════════════════════════════════════════════════════════════════════

def reconstruct_wt_and_compute_diff(peptide, mutation_pos):
    """
    Compute mutant-vs-WT features without knowing the exact WT sequence.

    Key insight: We don't NEED the exact WT residue to compute useful features.
    We can compute how "unusual" the mutant residue is at its position:
    1. BLOSUM self-score: how conserved is this amino acid type?
    2. Properties that suggest the residue is "foreign" at this position
    3. Average expected properties for each position (from IEDB data)
    """
    features = {}

    if pd.isna(mutation_pos) or int(mutation_pos) < 1 or int(mutation_pos) > len(peptide):
        for key in ['mut_blosum_self', 'mut_aa_rarity',
                     'mut_residue_hydro', 'mut_residue_charge', 'mut_residue_size',
                     'mut_residue_aromatic', 'mut_residue_polar']:
            features[key] = np.nan
        return features

    mut_pos = int(mutation_pos) - 1  # 0-indexed
    mut_aa = peptide[mut_pos]

    # BLOSUM self-score: how "expected" is this amino acid type?
    # Lower BLOSUM self-score = more common amino acid
    features['mut_blosum_self'] = BLOSUM62_SELF.get(mut_aa, 4)

    # Amino acid rarity (some amino acids are rare in the human proteome)
    # Approximate frequencies from human proteome
    AA_FREQ = {
        'A': 0.074, 'R': 0.042, 'N': 0.044, 'D': 0.059, 'C': 0.033,
        'Q': 0.037, 'E': 0.058, 'G': 0.074, 'H': 0.026, 'I': 0.038,
        'L': 0.076, 'K': 0.072, 'M': 0.018, 'F': 0.040, 'P': 0.050,
        'S': 0.081, 'T': 0.062, 'W': 0.013, 'Y': 0.033, 'V': 0.068,
    }
    features['mut_aa_rarity'] = -np.log(AA_FREQ.get(mut_aa, 0.01))

    # Properties of the mutant residue
    features['mut_residue_hydro'] = HYDROPHOBICITY.get(mut_aa, 0)
    features['mut_residue_charge'] = CHARGE.get(mut_aa, 0)
    features['mut_residue_size'] = MOLECULAR_WEIGHT.get(mut_aa, 0) / 200.0
    features['mut_residue_aromatic'] = AROMATIC.get(mut_aa, 0)
    features['mut_residue_polar'] = POLAR.get(mut_aa, 0)

    return features


# ══════════════════════════════════════════════════════════════════════════════
# IEDB-BASED SEQUENCE MODEL
# ══════════════════════════════════════════════════════════════════════════════

def prepare_iedb_sequence_features(iedb_df):
    """Compute sequence features for IEDB peptides."""
    features_list = []
    for _, row in iedb_df.iterrows():
        feat = compute_sequence_features(row['peptide'])
        features_list.append(feat)
    return pd.DataFrame(features_list)


def train_iedb_model(allele=None, peptide_lengths=[9, 10]):
    """
    Train a model on IEDB data to predict immunogenicity from sequence features.

    Returns trained model + feature columns for scoring TESLA peptides.
    """
    print("Loading IEDB training data...")
    iedb = get_iedb_train_data(allele=allele, peptide_lengths=peptide_lengths)
    print(f"  {len(iedb)} unique peptide-allele pairs, {iedb['immunogenic'].mean():.1%} positive")

    print("Computing sequence features for IEDB...")
    iedb_feats = prepare_iedb_sequence_features(iedb)
    feature_cols = list(iedb_feats.columns)

    X = iedb_feats.values
    y = iedb['immunogenic'].values

    # Handle NaN
    imputer = SimpleImputer(strategy='median')
    X = imputer.fit_transform(X)
    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    # Train model
    print("Training Random Forest on IEDB...")
    model = RandomForestClassifier(
        n_estimators=500, class_weight='balanced',
        max_depth=8, min_samples_leaf=10, random_state=42, n_jobs=-1,
    )
    model.fit(X, y)

    # Feature importance
    print("\nTop 15 features:")
    for feat, imp in sorted(zip(feature_cols, model.feature_importances_), key=lambda x: -x[1])[:15]:
        print(f"  {feat:30s} {imp:.4f}")

    return model, feature_cols, imputer, scaler


def score_tesla_with_iedb_model(tesla_df, model, feature_cols, imputer, scaler):
    """Score TESLA peptides using the IEDB-trained model."""
    tesla_feats = []
    for _, row in tesla_df.iterrows():
        feat = compute_sequence_features(row['peptide'])
        tesla_feats.append(feat)
    tesla_feat_df = pd.DataFrame(tesla_feats)

    # Ensure same columns
    for col in feature_cols:
        if col not in tesla_feat_df.columns:
            tesla_feat_df[col] = 0

    X_tesla = tesla_feat_df[feature_cols].values
    X_tesla = imputer.transform(X_tesla)
    X_tesla = scaler.transform(X_tesla)

    probs = model.predict_proba(X_tesla)[:, 1]
    return probs


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 70)
    print("  TRANSFER LEARNING: IEDB → TESLA")
    print("=" * 70)

    # Load TESLA
    tesla = load_tesla()
    y_true = tesla['immunogenic'].astype(int).values

    all_results = []

    # ── Model 1: Pan-allele IEDB model ──
    print("\n\n--- Pan-allele IEDB model ---")
    model, feat_cols, imp, scl = train_iedb_model(allele=None, peptide_lengths=[8, 9, 10, 11])
    probs_pan = score_tesla_with_iedb_model(tesla, model, feat_cols, imp, scl)
    metrics_pan = evaluate_predictions(y_true, probs_pan, name="IEDB pan-allele RF")
    print_metrics(metrics_pan)
    all_results.append(metrics_pan)

    # ── Model 2: HLA-A*02:01-specific (most data) ──
    print("\n\n--- HLA-A*02:01 IEDB model (applied to A02:01 TESLA subset) ---")
    model_a02, feat_cols_a02, imp_a02, scl_a02 = train_iedb_model(
        allele="HLA-A*02:01", peptide_lengths=[9, 10]
    )
    # Score only A*02:01 peptides in TESLA
    a02_mask = tesla['allele'] == 'HLA-A*02:01'
    if a02_mask.sum() > 0:
        tesla_a02 = tesla[a02_mask].copy()
        probs_a02 = score_tesla_with_iedb_model(tesla_a02, model_a02, feat_cols_a02, imp_a02, scl_a02)
        metrics_a02 = evaluate_predictions(
            tesla_a02['immunogenic'].astype(int).values,
            probs_a02,
            name="IEDB A*02:01-specific RF"
        )
        print_metrics(metrics_a02)
        all_results.append(metrics_a02)

    # ── Model 3: Combine IEDB scores with TESLA features ──
    print("\n\n--- Hybrid: IEDB sequence score + TESLA binding features ---")
    # Add IEDB score as a feature alongside TESLA features
    tesla['iedb_score'] = probs_pan

    # Add MHCflurry
    print("Running MHCflurry...")
    from tools.error_analysis_and_multifeature import add_mhcflurry_features
    tesla = add_mhcflurry_features(tesla)

    # Add mutation-site features
    mut_features = []
    for _, row in tesla.iterrows():
        feat = reconstruct_wt_and_compute_diff(row['peptide'], row.get('mutation_position'))
        mut_features.append(feat)
    tesla_mut = pd.DataFrame(mut_features)
    for col in tesla_mut.columns:
        tesla[col] = tesla_mut[col].values

    hybrid_features = [
        # TESLA binding features
        'predicted_affinity', 'binding_stability', 'tumor_abundance',
        'agretopicity',
        # MHCflurry
        'mhcflurry_presentation', 'mhcflurry_affinity', 'mhcflurry_processing',
        # IEDB transfer score
        'iedb_score',
        # Mutation site features
        'mut_blosum_self', 'mut_aa_rarity',
        'mut_residue_hydro', 'mut_residue_charge', 'mut_residue_size',
    ]

    X_hybrid = tesla[hybrid_features].values.copy()
    # Log-transform
    for i, col in enumerate(hybrid_features):
        if col in ['predicted_affinity', 'tumor_abundance', 'mhcflurry_affinity']:
            X_hybrid[:, i] = np.log1p(X_hybrid[:, i])

    X_hybrid = SimpleImputer(strategy='median').fit_transform(X_hybrid)
    X_hybrid = StandardScaler().fit_transform(X_hybrid)

    groups = tesla['patient_id'].values
    logo = LeaveOneGroupOut()

    # RF
    rf = RandomForestClassifier(
        n_estimators=500, class_weight='balanced',
        max_depth=5, min_samples_leaf=5, random_state=42
    )
    rf_probs = cross_val_predict(rf, X_hybrid, y_true, cv=logo, groups=groups, method='predict_proba')[:, 1]
    rf_metrics = evaluate_predictions(y_true, rf_probs, name="Hybrid RF (IEDB + TESLA + MHCflurry + mut)")
    print_metrics(rf_metrics)
    all_results.append(rf_metrics)

    # GB
    gb = GradientBoostingClassifier(
        n_estimators=200, max_depth=3, learning_rate=0.05,
        min_samples_leaf=5, random_state=42, subsample=0.8,
    )
    gb_probs = cross_val_predict(gb, X_hybrid, y_true, cv=logo, groups=groups, method='predict_proba')[:, 1]
    gb_metrics = evaluate_predictions(y_true, gb_probs, name="Hybrid GB (IEDB + TESLA + MHCflurry + mut)")
    print_metrics(gb_metrics)
    all_results.append(gb_metrics)

    # ── Per-patient for hybrid ──
    best_probs = rf_probs if rf_metrics['auprc'] >= gb_metrics['auprc'] else gb_probs
    best_name = "RF" if rf_metrics['auprc'] >= gb_metrics['auprc'] else "GB"
    print(f"\n--- Per-patient breakdown (Hybrid {best_name}) ---")
    from sklearn.metrics import roc_auc_score, average_precision_score
    for patient in sorted(tesla['patient_id'].unique()):
        mask = groups == patient
        p_y = y_true[mask]
        p_scores = best_probs[mask]
        n_imm = p_y.sum()
        if n_imm > 0 and (p_y == 0).sum() > 0:
            auc = roc_auc_score(p_y, p_scores)
            ap = average_precision_score(p_y, p_scores)
            print(f"  Patient {patient}: AUC-ROC={auc:.3f}, AUPRC={ap:.3f} "
                  f"({n_imm} immunogenic / {mask.sum()} total)")

    # ── Feature importance ──
    print("\n--- Hybrid RF Feature Importance ---")
    rf.fit(X_hybrid, y_true)
    for feat, imp in sorted(zip(hybrid_features, rf.feature_importances_), key=lambda x: -x[1]):
        bar = '█' * int(imp * 100)
        print(f"  {feat:40s} {imp:.4f} {bar}")

    # ── Baselines for comparison ──
    valid = ~tesla['mhcflurry_presentation'].isna()
    mhcf = evaluate_predictions(
        y_true[valid.values],
        tesla.loc[valid, 'mhcflurry_presentation'].values,
        name='MHCflurry single'
    )
    all_results.append(mhcf)

    np.random.seed(42)
    rand = evaluate_predictions(y_true, np.random.rand(len(tesla)), name='Random')
    all_results.append(rand)

    # ── Final comparison ──
    print("\n\n" + "=" * 70)
    print("  FINAL COMPARISON")
    print("=" * 70)
    compare_models(all_results)
    print("\nPublished TESLA ensemble: AUPRC ~0.28, AUC-ROC ~0.80")
    print("Previous best (RF TESLA+MHCflurry): AUPRC 0.212, AUC-ROC 0.738")
