"""
Run MHCflurry baseline on TESLA benchmark.

MHCflurry predicts peptide-MHC binding affinity and presentation score.
We use these as proxy scores for immunogenicity and evaluate on TESLA.

This tests the hypothesis: "Is binding affinity alone a good predictor of immunogenicity?"
Spoiler: It's decent but not great -- that's the gap we're trying to close.
"""
import sys
import numpy as np
sys.path.insert(0, ".")

from tools.data_loader import load_tesla
from tools.evaluate import evaluate_predictions, print_metrics, compare_models


def run_mhcflurry_predictions(tesla_df):
    """Run MHCflurry binding predictions on TESLA peptides."""
    from mhcflurry import Class1PresentationPredictor

    predictor = Class1PresentationPredictor.load()

    results = []
    for _, row in tesla_df.iterrows():
        allele = row["allele"]
        peptide = row["peptide"]

        try:
            pred = predictor.predict(
                peptides=[peptide],
                alleles=[allele],
                verbose=0,
            )
            # presentation_score is the combined binding + processing score
            presentation_score = pred["presentation_score"].values[0]
            affinity = pred["affinity"].values[0]
            processing_score = pred["processing_score"].values[0]

            results.append({
                "peptide": peptide,
                "allele": allele,
                "mhcflurry_presentation": presentation_score,
                "mhcflurry_affinity": affinity,
                "mhcflurry_processing": processing_score,
            })
        except Exception as e:
            print(f"  Warning: Failed for {allele} {peptide}: {e}")
            results.append({
                "peptide": peptide,
                "allele": allele,
                "mhcflurry_presentation": np.nan,
                "mhcflurry_affinity": np.nan,
                "mhcflurry_processing": np.nan,
            })

    import pandas as pd
    return pd.DataFrame(results)


def run_feature_baselines(tesla_df):
    """
    Use TESLA's own pre-computed features as baseline predictors.
    This shows how well individual biological features predict immunogenicity.
    """
    y_true = tesla_df["immunogenic"].astype(int).values
    all_results = []

    # Each feature as a standalone predictor
    feature_configs = [
        # (column, name, higher_is_better)
        ("predicted_affinity", "NetMHCpan affinity (inverted)", False),
        ("binding_stability", "Binding stability", True),
        ("tumor_abundance", "Tumor abundance (TPM)", True),
        ("frac_hydrophobic", "Fraction hydrophobic", True),
        ("foreignness", "Foreignness", True),
    ]

    for col, name, higher_is_better in feature_configs:
        scores = tesla_df[col].values.copy()
        valid = ~np.isnan(scores)
        if valid.sum() < 100:
            print(f"  Skipping {name}: only {valid.sum()} non-null values")
            continue

        # For affinity, lower nM = stronger binding = more likely immunogenic
        if not higher_is_better:
            scores = -scores

        metrics = evaluate_predictions(y_true[valid], scores[valid], name=name)
        all_results.append(metrics)

    return all_results


if __name__ == "__main__":
    print("Loading TESLA benchmark data...")
    tesla = load_tesla()
    y_true = tesla["immunogenic"].astype(int).values

    all_results = []

    # 1. Random baseline
    print("\n--- Random Baseline ---")
    np.random.seed(42)
    metrics = evaluate_predictions(y_true, np.random.rand(len(tesla)), name="Random")
    print_metrics(metrics)
    all_results.append(metrics)

    # 2. Feature baselines (TESLA pre-computed features)
    print("\n--- Individual Feature Baselines ---")
    feature_results = run_feature_baselines(tesla)
    for m in feature_results:
        print_metrics(m)
    all_results.extend(feature_results)

    # 3. MHCflurry predictions
    print("\n--- MHCflurry Predictions ---")
    print("Running MHCflurry on 608 TESLA peptides...")
    mhcflurry_preds = run_mhcflurry_predictions(tesla)

    # Evaluate presentation score
    valid = ~mhcflurry_preds["mhcflurry_presentation"].isna()
    metrics_pres = evaluate_predictions(
        y_true[valid.values],
        mhcflurry_preds.loc[valid, "mhcflurry_presentation"].values,
        name="MHCflurry presentation"
    )
    print_metrics(metrics_pres)
    all_results.append(metrics_pres)

    # Evaluate affinity (inverted: lower nM = higher score)
    metrics_aff = evaluate_predictions(
        y_true[valid.values],
        -mhcflurry_preds.loc[valid, "mhcflurry_affinity"].values,
        name="MHCflurry affinity (inv.)"
    )
    print_metrics(metrics_aff)
    all_results.append(metrics_aff)

    # 4. Comparison table
    compare_models(all_results)
