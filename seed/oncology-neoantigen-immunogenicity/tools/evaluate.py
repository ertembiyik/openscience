"""
Standardized evaluation harness for neoantigen immunogenicity prediction.

Implements the TESLA evaluation metrics:
- AUPRC: Area Under the Precision-Recall Curve
- AUC-ROC: Area Under the ROC Curve
- FR: Fraction of immunogenic peptides in top-100 predictions
- TTIF: Top-20 Immunogenic Fraction

Usage:
    from evaluate import evaluate_predictions
    metrics = evaluate_predictions(y_true, y_score, name="MHCflurry")
"""
import numpy as np
from sklearn.metrics import (
    precision_recall_curve,
    roc_auc_score,
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
)


def evaluate_predictions(y_true, y_score, name="model", top_n_fr=100, top_n_ttif=20):
    """
    Evaluate immunogenicity predictions using TESLA-style metrics.

    Args:
        y_true: Binary ground truth labels (1=immunogenic, 0=not)
        y_score: Prediction scores (higher = more likely immunogenic)
        name: Model name for display
        top_n_fr: Top-N cutoff for Fraction Ranked metric
        top_n_ttif: Top-N cutoff for TTIF metric

    Returns:
        dict with all metrics
    """
    y_true = np.asarray(y_true, dtype=int)
    y_score = np.asarray(y_score, dtype=float)

    # Remove NaN scores
    valid = ~np.isnan(y_score)
    if not valid.all():
        print(f"  Warning: {(~valid).sum()} NaN scores removed")
        y_true = y_true[valid]
        y_score = y_score[valid]

    n_total = len(y_true)
    n_pos = y_true.sum()
    n_neg = n_total - n_pos

    # Sort by score descending
    order = np.argsort(-y_score)
    y_true_sorted = y_true[order]

    # Core metrics
    auc_roc = roc_auc_score(y_true, y_score) if n_pos > 0 and n_neg > 0 else float("nan")
    auprc = average_precision_score(y_true, y_score) if n_pos > 0 else float("nan")

    # FR: Fraction of immunogenic peptides found in top-N
    top_n = min(top_n_fr, n_total)
    fr = y_true_sorted[:top_n].sum() / n_pos if n_pos > 0 else 0.0

    # TTIF: Fraction of top-N that are immunogenic
    top_n2 = min(top_n_ttif, n_total)
    ttif = y_true_sorted[:top_n2].sum() / top_n2

    # Precision/Recall/F1 at various thresholds
    # Use median score as default threshold
    threshold = np.median(y_score)
    y_pred = (y_score >= threshold).astype(int)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)

    metrics = {
        "name": name,
        "n_total": n_total,
        "n_positive": int(n_pos),
        "n_negative": int(n_neg),
        "auc_roc": auc_roc,
        "auprc": auprc,
        "fr_top100": fr,
        "ttif_top20": ttif,
        "f1_median_threshold": f1,
        "precision_median_threshold": precision,
        "recall_median_threshold": recall,
    }

    return metrics


def print_metrics(metrics):
    """Pretty-print evaluation metrics."""
    print(f"\n{'='*50}")
    print(f"  Model: {metrics['name']}")
    print(f"{'='*50}")
    print(f"  Dataset: {metrics['n_total']} peptides ({metrics['n_positive']} positive, {metrics['n_negative']} negative)")
    print(f"  AUC-ROC:           {metrics['auc_roc']:.4f}")
    print(f"  AUPRC:             {metrics['auprc']:.4f}")
    print(f"  FR (top-100):      {metrics['fr_top100']:.4f}  ({metrics['fr_top100']*100:.1f}% of immunogenic found)")
    print(f"  TTIF (top-20):     {metrics['ttif_top20']:.4f}  ({metrics['ttif_top20']*100:.1f}% of top-20 are immunogenic)")
    print(f"  F1 (median thr):   {metrics['f1_median_threshold']:.4f}")
    print(f"  Precision:         {metrics['precision_median_threshold']:.4f}")
    print(f"  Recall:            {metrics['recall_median_threshold']:.4f}")
    print(f"{'='*50}")


def compare_models(results_list):
    """Print comparison table of multiple models."""
    import pandas as pd
    df = pd.DataFrame(results_list)
    cols = ["name", "auc_roc", "auprc", "fr_top100", "ttif_top20"]
    print("\n=== MODEL COMPARISON ===")
    print(df[cols].to_string(index=False, float_format="%.4f"))


if __name__ == "__main__":
    # Quick test with random data
    np.random.seed(42)
    y_true = np.array([1]*37 + [0]*571)  # TESLA-like imbalance
    y_score = np.random.rand(608)
    metrics = evaluate_predictions(y_true, y_score, name="random_baseline")
    print_metrics(metrics)
    print("\n(Random baseline -- expect AUC ~0.50, AUPRC ~0.06)")
