"""
Error analysis of MHCflurry on TESLA + multi-feature baseline models.

Part 1: Error Analysis
- Which peptides does MHCflurry get wrong (false positives / false negatives)?
- Are there patterns in the errors (by patient, allele, peptide length, mutation position)?

Part 2: Multi-Feature Baselines
- Logistic regression combining all TESLA features
- Random forest combining all TESLA features
- Compare to single-feature baselines and published TESLA ensemble (~0.28 AUPRC)
"""
import sys
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import LeaveOneGroupOut, cross_val_predict
from sklearn.impute import SimpleImputer

sys.path.insert(0, ".")
from tools.data_loader import load_tesla
from tools.evaluate import evaluate_predictions, print_metrics, compare_models


# ── Features available in TESLA ──────────────────────────────────────────────
TESLA_FEATURES = [
    "predicted_affinity",    # NetMHCpan binding affinity (nM) -- lower = stronger
    "binding_stability",     # pMHC stability (hours)
    "tumor_abundance",       # RNA expression (TPM)
    "frac_hydrophobic",      # Fraction hydrophobic residues
    "agretopicity",          # Mutant/wildtype binding ratio
    "foreignness",           # Foreignness score
    "mutation_position",     # Position of mutation in peptide
    "peptide_length",        # Length of peptide (9, 10, 11-mers)
]


def add_mhcflurry_features(tesla_df):
    """Run MHCflurry and add presentation/affinity/processing scores."""
    from mhcflurry import Class1PresentationPredictor
    predictor = Class1PresentationPredictor.load()

    pres_scores = []
    aff_scores = []
    proc_scores = []

    for _, row in tesla_df.iterrows():
        try:
            pred = predictor.predict(
                peptides=[row["peptide"]],
                alleles=[row["allele"]],
                verbose=0,
            )
            pres_scores.append(pred["presentation_score"].values[0])
            aff_scores.append(pred["affinity"].values[0])
            proc_scores.append(pred["processing_score"].values[0])
        except Exception as e:
            print(f"  Warning: Failed for {row['allele']} {row['peptide']}: {e}")
            pres_scores.append(np.nan)
            aff_scores.append(np.nan)
            proc_scores.append(np.nan)

    tesla_df = tesla_df.copy()
    tesla_df["mhcflurry_presentation"] = pres_scores
    tesla_df["mhcflurry_affinity"] = aff_scores
    tesla_df["mhcflurry_processing"] = proc_scores
    return tesla_df


# ═══════════════════════════════════════════════════════════════════════════════
# PART 1: ERROR ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

def error_analysis(tesla_df):
    """Analyze where MHCflurry presentation score fails."""
    print("\n" + "=" * 70)
    print("  PART 1: ERROR ANALYSIS -- Where MHCflurry Goes Wrong")
    print("=" * 70)

    scores = tesla_df["mhcflurry_presentation"].values
    y_true = tesla_df["immunogenic"].astype(int).values
    valid = ~np.isnan(scores)
    df = tesla_df[valid].copy()
    scores = scores[valid]
    y_true = y_true[valid]

    # Rank by presentation score (higher = more likely immunogenic per MHCflurry)
    df["rank"] = (-scores).argsort().argsort() + 1  # 1-indexed rank
    df["score"] = scores

    # Immunogenic peptides that MHCflurry MISSES (ranked low)
    immunogenic = df[df["immunogenic"] == True].sort_values("rank", ascending=False)
    non_immunogenic = df[df["immunogenic"] == False].sort_values("rank")

    print(f"\nTotal: {len(df)} peptides, {y_true.sum()} immunogenic")
    print(f"Median rank of immunogenic peptides: {immunogenic['rank'].median():.0f} / {len(df)}")
    print(f"Median rank of non-immunogenic peptides: {non_immunogenic['rank'].median():.0f} / {len(df)}")

    # ── False negatives: immunogenic peptides ranked OUTSIDE top 100 ──
    fn = immunogenic[immunogenic["rank"] > 100]
    print(f"\n--- FALSE NEGATIVES: {len(fn)} immunogenic peptides ranked outside top-100 ---")
    print(f"    (These are the ones MHCflurry MISSES)")
    if len(fn) > 0:
        cols = ["peptide", "allele", "patient_id", "rank", "score",
                "predicted_affinity", "binding_stability", "tumor_abundance"]
        print(fn[cols].to_string(index=False))

    # ── False positives: non-immunogenic peptides ranked IN top 20 ──
    fp = non_immunogenic[non_immunogenic["rank"] <= 20]
    print(f"\n--- FALSE POSITIVES: {len(fp)} non-immunogenic peptides in top-20 ---")
    print(f"    (These are the ones MHCflurry falsely calls immunogenic)")
    if len(fp) > 0:
        cols = ["peptide", "allele", "patient_id", "rank", "score",
                "predicted_affinity", "binding_stability", "tumor_abundance"]
        print(fp[cols].to_string(index=False))

    # ── True positives: immunogenic peptides in top 20 ──
    tp = immunogenic[immunogenic["rank"] <= 20]
    print(f"\n--- TRUE POSITIVES: {len(tp)} immunogenic peptides in top-20 ---")
    if len(tp) > 0:
        cols = ["peptide", "allele", "patient_id", "rank", "score",
                "predicted_affinity", "binding_stability", "tumor_abundance"]
        print(tp[cols].to_string(index=False))

    # ── Pattern analysis ──
    print("\n--- PATTERN ANALYSIS ---")

    # By patient
    print("\nImmunogenic detection rate by patient:")
    for patient in sorted(df["patient_id"].unique()):
        p_df = df[df["patient_id"] == patient]
        p_imm = p_df[p_df["immunogenic"] == True]
        p_imm_top100 = p_imm[p_imm["rank"] <= 100]
        n_imm = len(p_imm)
        if n_imm > 0:
            print(f"  {patient}: {len(p_imm_top100)}/{n_imm} immunogenic in top-100"
                  f" ({len(p_imm_top100)/n_imm:.0%}), "
                  f"{len(p_df)} total peptides")

    # By allele
    print("\nImmunogenic detection rate by HLA allele:")
    for allele in sorted(df["allele"].unique()):
        a_df = df[df["allele"] == allele]
        a_imm = a_df[a_df["immunogenic"] == True]
        n_imm = len(a_imm)
        if n_imm > 0:
            a_imm_top100 = a_imm[a_imm["rank"] <= 100]
            print(f"  {allele}: {len(a_imm_top100)}/{n_imm} in top-100, "
                  f"{len(a_df)} total peptides")

    # By peptide length
    print("\nImmunogenic rate by peptide length:")
    for length in sorted(df["peptide_length"].unique()):
        l_df = df[df["peptide_length"] == length]
        l_imm = l_df[l_df["immunogenic"] == True]
        print(f"  {length}-mer: {len(l_imm)}/{len(l_df)} immunogenic "
              f"({len(l_imm)/len(l_df):.1%} if {len(l_df)} > 10 else 'too few')")

    # Feature comparison: immunogenic vs non-immunogenic
    print("\nFeature means -- Immunogenic vs Non-immunogenic:")
    features_to_compare = ["predicted_affinity", "binding_stability", "tumor_abundance",
                           "frac_hydrophobic", "foreignness", "agretopicity",
                           "mhcflurry_presentation", "mhcflurry_affinity"]
    for feat in features_to_compare:
        if feat in df.columns:
            imm_mean = df.loc[df["immunogenic"] == True, feat].mean()
            non_mean = df.loc[df["immunogenic"] == False, feat].mean()
            ratio = imm_mean / non_mean if non_mean != 0 else float("inf")
            print(f"  {feat:30s}  imm={imm_mean:10.2f}  non={non_mean:10.2f}  ratio={ratio:.2f}")

    # What distinguishes the FALSE NEGATIVES from TRUE POSITIVES?
    if len(fn) > 0 and len(tp) > 0:
        print("\n--- What distinguishes missed immunogenic (FN) from detected immunogenic (TP)? ---")
        for feat in ["predicted_affinity", "binding_stability", "tumor_abundance",
                      "mhcflurry_presentation"]:
            if feat in df.columns:
                fn_mean = fn[feat].mean()
                tp_mean = tp[feat].mean()
                print(f"  {feat:30s}  FN={fn_mean:10.2f}  TP={tp_mean:10.2f}")

    return df


# ═══════════════════════════════════════════════════════════════════════════════
# PART 2: MULTI-FEATURE BASELINES
# ═══════════════════════════════════════════════════════════════════════════════

def prepare_features(tesla_df, feature_cols):
    """Prepare feature matrix with imputation and scaling."""
    X = tesla_df[feature_cols].values.copy()

    # Log-transform affinity (nM scale varies hugely)
    aff_idx = feature_cols.index("predicted_affinity") if "predicted_affinity" in feature_cols else None
    if aff_idx is not None:
        X[:, aff_idx] = np.log1p(X[:, aff_idx])

    # Log-transform tumor abundance (TPM varies hugely)
    tpm_idx = feature_cols.index("tumor_abundance") if "tumor_abundance" in feature_cols else None
    if tpm_idx is not None:
        X[:, tpm_idx] = np.log1p(X[:, tpm_idx])

    # Log-transform MHCflurry affinity if present
    mhc_aff_idx = feature_cols.index("mhcflurry_affinity") if "mhcflurry_affinity" in feature_cols else None
    if mhc_aff_idx is not None:
        X[:, mhc_aff_idx] = np.log1p(X[:, mhc_aff_idx])

    # Impute missing values with median
    imputer = SimpleImputer(strategy="median")
    X = imputer.fit_transform(X)

    # Standardize
    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    return X, imputer, scaler


def run_multifeature_baselines(tesla_df, feature_cols, label=""):
    """
    Train and evaluate multi-feature models using leave-one-patient-out CV.

    LOGO CV is the right approach here because:
    1. TESLA has only 6 patients -- we can't split randomly (data leakage risk)
    2. In clinical use, the model must generalize to new patients
    3. This matches how the TESLA paper evaluated their ensemble
    """
    y = tesla_df["immunogenic"].astype(int).values
    groups = tesla_df["patient_id"].values
    X, _, _ = prepare_features(tesla_df, feature_cols)

    all_results = []
    logo = LeaveOneGroupOut()

    # ── Logistic Regression ──
    print(f"\n--- Logistic Regression ({label}) ---")
    # Use cross_val_predict with LOGO to get out-of-fold predictions
    lr = LogisticRegression(
        class_weight="balanced",  # Handle 6.1% positive rate
        max_iter=1000,
        C=1.0,
        random_state=42,
    )
    lr_probs = cross_val_predict(lr, X, y, cv=logo, groups=groups, method="predict_proba")[:, 1]
    lr_metrics = evaluate_predictions(y, lr_probs, name=f"Logistic Regression {label}")
    print_metrics(lr_metrics)
    all_results.append(lr_metrics)

    # Feature importance from full-dataset fit (for interpretation only)
    lr.fit(X, y)
    print("\n  Feature coefficients (full-data fit):")
    for feat, coef in sorted(zip(feature_cols, lr.coef_[0]), key=lambda x: -abs(x[1])):
        print(f"    {feat:30s}  {coef:+.3f}")

    # ── Random Forest ──
    print(f"\n--- Random Forest ({label}) ---")
    rf = RandomForestClassifier(
        n_estimators=500,
        class_weight="balanced",
        max_depth=5,
        min_samples_leaf=5,
        random_state=42,
    )
    rf_probs = cross_val_predict(rf, X, y, cv=logo, groups=groups, method="predict_proba")[:, 1]
    rf_metrics = evaluate_predictions(y, rf_probs, name=f"Random Forest {label}")
    print_metrics(rf_metrics)
    all_results.append(rf_metrics)

    # Feature importance
    rf.fit(X, y)
    print("\n  Feature importances (full-data fit):")
    for feat, imp in sorted(zip(feature_cols, rf.feature_importances_), key=lambda x: -x[1]):
        print(f"    {feat:30s}  {imp:.3f}")

    # ── Per-patient breakdown (for the best model) ──
    best_model_probs = lr_probs if lr_metrics["auprc"] >= rf_metrics["auprc"] else rf_probs
    best_name = "LR" if lr_metrics["auprc"] >= rf_metrics["auprc"] else "RF"
    print(f"\n--- Per-patient breakdown ({best_name}) ---")
    for patient in sorted(tesla_df["patient_id"].unique()):
        mask = tesla_df["patient_id"].values == patient
        p_y = y[mask]
        p_scores = best_model_probs[mask]
        n_imm = p_y.sum()
        if n_imm > 0 and (p_y == 0).sum() > 0:
            from sklearn.metrics import roc_auc_score, average_precision_score
            auc = roc_auc_score(p_y, p_scores)
            ap = average_precision_score(p_y, p_scores)
            print(f"  {patient}: AUC-ROC={auc:.3f}, AUPRC={ap:.3f} "
                  f"({n_imm} immunogenic / {mask.sum()} total)")
        else:
            print(f"  {patient}: {n_imm} immunogenic / {mask.sum()} total (can't compute AUC)")

    return all_results


if __name__ == "__main__":
    print("Loading TESLA benchmark data...")
    tesla = load_tesla()

    print("Running MHCflurry on TESLA peptides...")
    tesla = add_mhcflurry_features(tesla)

    # ═══════════════════════════════════════════════════════════════════════
    # PART 1: Error Analysis
    # ═══════════════════════════════════════════════════════════════════════
    df_analyzed = error_analysis(tesla)

    # ═══════════════════════════════════════════════════════════════════════
    # PART 2: Multi-Feature Models
    # ═══════════════════════════════════════════════════════════════════════
    print("\n\n" + "=" * 70)
    print("  PART 2: MULTI-FEATURE BASELINES")
    print("=" * 70)

    all_results = []

    # Model A: TESLA features only (what was available in the original paper)
    tesla_only_features = [
        "predicted_affinity", "binding_stability", "tumor_abundance",
        "frac_hydrophobic", "agretopicity", "foreignness",
        "mutation_position", "peptide_length",
    ]
    results_a = run_multifeature_baselines(tesla, tesla_only_features, label="(TESLA features)")
    all_results.extend(results_a)

    # Model B: TESLA features + MHCflurry scores
    all_features = tesla_only_features + [
        "mhcflurry_presentation", "mhcflurry_affinity", "mhcflurry_processing",
    ]
    results_b = run_multifeature_baselines(tesla, all_features, label="(TESLA + MHCflurry)")
    all_results.extend(results_b)

    # ── Add single-feature baselines for comparison ──
    y_true = tesla["immunogenic"].astype(int).values

    # MHCflurry presentation (best single feature from previous analysis)
    valid = ~tesla["mhcflurry_presentation"].isna()
    mhcf_metrics = evaluate_predictions(
        y_true[valid.values],
        tesla.loc[valid, "mhcflurry_presentation"].values,
        name="MHCflurry presentation (single)"
    )
    all_results.append(mhcf_metrics)

    # Random
    np.random.seed(42)
    rand_metrics = evaluate_predictions(y_true, np.random.rand(len(tesla)), name="Random")
    all_results.append(rand_metrics)

    # ═══════════════════════════════════════════════════════════════════════
    # Final Comparison
    # ═══════════════════════════════════════════════════════════════════════
    print("\n\n" + "=" * 70)
    print("  FINAL MODEL COMPARISON")
    print("=" * 70)
    compare_models(all_results)

    print("\n\nPublished TESLA ensemble reference: AUPRC ~0.28, AUC-ROC ~0.80")
    print("Target: match or exceed these numbers.")
