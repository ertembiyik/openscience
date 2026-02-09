"""
Explore the IEDB T-cell epitope dataset.
Identifies key columns for immunogenicity prediction and produces summary stats.

IEDB CSV structure: Row 0 is sub-headers (field descriptions), actual data starts row 1.
"""
import pandas as pd

DATA_PATH = "data/iedb/tcell_full_v3.csv"

print("Loading IEDB T-cell data...")
df = pd.read_csv(DATA_PATH, skiprows=[1], low_memory=False)
print(f"Loaded: {len(df):,} rows x {len(df.columns)} columns\n")

# Key columns mapped correctly:
COL_EPITOPE_TYPE = "Epitope.1"       # Object Type: "Linear peptide", etc.
COL_PEPTIDE_SEQ = "Epitope.2"        # Name: the actual peptide sequence
COL_QUALITATIVE = "Assay.5"          # Qualitative Measurement: Positive/Negative
COL_MHC_ALLELE = "MHC Restriction"   # MHC allele name: "HLA-A*02:01", etc.
COL_MHC_CLASS = "MHC Restriction.4"  # MHC class: "I" or "II"
COL_HOST = "Host"                    # Host organism name

print("=== RAW DATA OVERVIEW ===")
print(f"Epitope types: {df[COL_EPITOPE_TYPE].value_counts().head(5).to_string()}")
print(f"\nQualitative measurements: {df[COL_QUALITATIVE].value_counts().to_string()}")
print(f"\nMHC classes: {df[COL_MHC_CLASS].value_counts().to_string()}")
print(f"\nHosts (top 5): {df[COL_HOST].value_counts().head(5).to_string()}")

# Filter for our use case: human, MHC class I, linear peptides, with result
print("\n\n=== FILTERING FOR IMMUNOGENICITY PREDICTION ===")
mask = (
    df[COL_HOST].str.contains("Homo sapiens", case=False, na=False) &
    (df[COL_MHC_CLASS] == "I") &
    (df[COL_EPITOPE_TYPE] == "Linear peptide") &
    df[COL_QUALITATIVE].notna() &
    df[COL_PEPTIDE_SEQ].notna() &
    df[COL_MHC_ALLELE].notna()
)
filtered = df[mask].copy()
print(f"Human MHC-I linear peptide T-cell assays: {len(filtered):,}")

# Qualitative outcomes
print(f"\nQualitative outcomes:")
print(filtered[COL_QUALITATIVE].value_counts().to_string())

# Binary immunogenicity label
pos_labels = ["Positive", "Positive-High", "Positive-Intermediate", "Positive-Low"]
filtered["immunogenic"] = filtered[COL_QUALITATIVE].isin(pos_labels).astype(int)
n_pos = filtered["immunogenic"].sum()
n_neg = len(filtered) - n_pos
print(f"\nBinary label:")
print(f"  Immunogenic (positive):     {n_pos:,}")
print(f"  Not immunogenic (negative): {n_neg:,}")
print(f"  Positive rate:              {n_pos/len(filtered):.1%}")

# Unique peptides and alleles
print(f"\nUnique peptide sequences: {filtered[COL_PEPTIDE_SEQ].nunique():,}")
print(f"Unique MHC alleles:      {filtered[COL_MHC_ALLELE].nunique():,}")

# Top MHC alleles
print(f"\nTop 15 MHC-I alleles:")
print(filtered[COL_MHC_ALLELE].value_counts().head(15).to_string())

# Peptide length distribution
filtered["peptide_length"] = filtered[COL_PEPTIDE_SEQ].str.len()
print(f"\nPeptide length distribution:")
print(filtered["peptide_length"].value_counts().sort_index().head(20).to_string())

# Save filtered dataset for model training
output_path = "data/iedb/iedb_human_mhci_tcell.csv"
cols_to_save = [COL_PEPTIDE_SEQ, COL_MHC_ALLELE, COL_QUALITATIVE, "immunogenic", "peptide_length"]
filtered[cols_to_save].to_csv(output_path, index=False)
print(f"\nSaved filtered dataset: {output_path} ({len(filtered):,} rows)")

print("\n=== DONE ===")
