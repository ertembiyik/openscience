"""
Data loading utilities for neoantigen immunogenicity prediction.

Provides clean, standardized access to:
1. IEDB T-cell epitope data (training)
2. TESLA benchmark data (evaluation)
"""
import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent


def load_iedb(filtered=True):
    """
    Load IEDB T-cell epitope data.

    Args:
        filtered: If True, load pre-filtered human MHC-I data (122K rows).
                  If False, load full dataset (567K rows, slow).

    Returns:
        DataFrame with columns: peptide, allele, qualitative, immunogenic, peptide_length
    """
    if filtered:
        path = PROJECT_ROOT / "data" / "iedb" / "iedb_human_mhci_tcell.csv"
        df = pd.read_csv(path)
        df.columns = ["peptide", "allele", "qualitative", "immunogenic", "peptide_length"]
    else:
        path = PROJECT_ROOT / "data" / "iedb" / "tcell_full_v3.csv"
        df = pd.read_csv(path, skiprows=[1], low_memory=False)
        df = df.rename(columns={
            "Epitope.2": "peptide",
            "MHC Restriction": "allele",
            "Assay.5": "qualitative",
        })
    return df


def load_tesla():
    """
    Load TESLA benchmark dataset (Table S4 from Wells et al., Cell 2020).

    Returns:
        DataFrame with standardized columns including:
        - peptide: mutant peptide sequence
        - allele: HLA allele (format: A*02:01)
        - immunogenic: binary label (True/False)
        - binding_affinity: measured binding affinity (nM)
        - predicted_affinity: NetMHCpan predicted binding affinity (nM)
        - tumor_abundance: RNA expression (TPM)
        - binding_stability: binding stability (hours)
        - frac_hydrophobic: fraction of hydrophobic residues
        - agretopicity: mutant/wildtype binding ratio
        - foreignness: foreignness score
        - mutation_position: position of mutation in peptide
        - patient_id: patient identifier
        - tissue_type: PBMC or TIL
    """
    path = PROJECT_ROOT / "data" / "tesla" / "tesla_table_s4.xlsx"
    df = pd.read_excel(path, sheet_name="master-bindings-selected")

    df = df.rename(columns={
        "ALT_EPI_SEQ": "peptide",
        "MHC": "allele",
        "VALIDATED": "immunogenic",
        "PEP_LEN": "peptide_length",
        "MEASURED_BINDING_AFFINITY": "binding_affinity",
        "NETMHC_PAN_BINDING_AFFINITY": "predicted_affinity",
        "TUMOR_ABUNDANCE": "tumor_abundance",
        "BINDING_STABILITY": "binding_stability",
        "FRAC_HYDROPHOBIC": "frac_hydrophobic",
        "AGRETOPICITY": "agretopicity",
        "FOREIGNNESS": "foreignness",
        "MUTATION_POSITION": "mutation_position",
        "PATIENT_ID": "patient_id",
        "TISSUE_TYPE": "tissue_type",
    })

    # Standardize allele format to match IEDB (add HLA- prefix)
    df["allele"] = "HLA-" + df["allele"]

    return df


def deduplicate_iedb(df, strategy="majority"):
    """
    Handle duplicate peptide-allele pairs with conflicting labels in IEDB.

    The same peptide-allele combination can appear multiple times with different
    qualitative results (e.g., Positive in one study, Negative in another).

    Args:
        df: IEDB DataFrame from load_iedb()
        strategy: How to resolve conflicts:
            - "majority": Use majority vote (if more positive than negative, label positive)
            - "any_positive": Label positive if ANY assay was positive
            - "strict_positive": Label positive only if ALL assays were positive

    Returns:
        DataFrame with one row per unique peptide-allele pair
    """
    grouped = df.groupby(["peptide", "allele"])

    if strategy == "majority":
        result = grouped.agg(
            immunogenic=("immunogenic", lambda x: int(x.mean() > 0.5)),
            n_assays=("immunogenic", "count"),
            n_positive=("immunogenic", "sum"),
            peptide_length=("peptide_length", "first"),
        ).reset_index()
    elif strategy == "any_positive":
        result = grouped.agg(
            immunogenic=("immunogenic", "max"),
            n_assays=("immunogenic", "count"),
            n_positive=("immunogenic", "sum"),
            peptide_length=("peptide_length", "first"),
        ).reset_index()
    elif strategy == "strict_positive":
        result = grouped.agg(
            immunogenic=("immunogenic", "min"),
            n_assays=("immunogenic", "count"),
            n_positive=("immunogenic", "sum"),
            peptide_length=("peptide_length", "first"),
        ).reset_index()
    else:
        raise ValueError(f"Unknown strategy: {strategy}")

    return result


def get_iedb_train_data(allele=None, peptide_lengths=None, deduplicate=True, strategy="majority"):
    """
    Get ready-to-train IEDB data with optional filtering.

    Args:
        allele: Filter to specific allele (e.g., "HLA-A*02:01"). None = all alleles.
        peptide_lengths: List of peptide lengths to include (e.g., [9, 10]). None = all.
        deduplicate: Whether to deduplicate peptide-allele pairs.
        strategy: Deduplication strategy (see deduplicate_iedb).

    Returns:
        DataFrame with columns: peptide, allele, immunogenic, peptide_length
    """
    df = load_iedb(filtered=True)

    # Filter by allele
    if allele is not None:
        df = df[df["allele"] == allele]

    # Filter by peptide length
    if peptide_lengths is not None:
        df = df[df["peptide_length"].isin(peptide_lengths)]

    # Remove entries with generic allele names (not useful for prediction)
    generic_alleles = ["HLA class I", "HLA class II", "HLA-A2", "HLA-B7"]
    df = df[~df["allele"].isin(generic_alleles)]

    # Deduplicate
    if deduplicate:
        df = deduplicate_iedb(df, strategy=strategy)

    return df


if __name__ == "__main__":
    print("=== IEDB (filtered) ===")
    iedb = load_iedb()
    print(f"  {len(iedb):,} rows, {iedb['immunogenic'].mean():.1%} positive")

    print("\n=== IEDB (deduplicated, majority vote) ===")
    iedb_dedup = get_iedb_train_data()
    print(f"  {len(iedb_dedup):,} unique peptide-allele pairs")
    print(f"  {iedb_dedup['immunogenic'].mean():.1%} positive")

    print("\n=== IEDB HLA-A*02:01 only, 9-mers ===")
    iedb_a0201 = get_iedb_train_data(allele="HLA-A*02:01", peptide_lengths=[9])
    print(f"  {len(iedb_a0201):,} unique peptide-allele pairs")
    print(f"  {iedb_a0201['immunogenic'].mean():.1%} positive")

    print("\n=== TESLA ===")
    tesla = load_tesla()
    print(f"  {len(tesla)} peptides, {tesla['immunogenic'].sum()} immunogenic ({tesla['immunogenic'].mean():.1%})")
    print(f"  Alleles: {tesla['allele'].nunique()}")
    print(f"  Patients: {tesla['patient_id'].nunique()}")
