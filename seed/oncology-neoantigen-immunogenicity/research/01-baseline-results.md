# Baseline Results on TESLA Benchmark

*Date: 2026-02-08 | Status: Complete*

## The Question

Given a cancer patient's tumor mutation and HLA type, can we predict whether that mutation will trigger a T-cell immune response?

## The Benchmark: TESLA Dataset

From: Wells et al., "Key Parameters of Tumor Epitope Immunogenicity Revealed Through a Consortium Approach Improve Neoantigen Prediction," Cell 2020.

- **608 peptides** from 6 cancer patients (3 melanoma, 2 NSCLC)
- **37 immunogenic** (6.1%), **571 non-immunogenic** (93.9%)
- 13 HLA alleles, dominated by HLA-A*02:01 (239 peptides)
- Each peptide has pre-computed features: binding affinity, stability, tumor expression, etc.
- Gold standard: validated by T-cell binding assays in patient-matched samples

## Evaluation Metrics

Following TESLA conventions:
- **AUPRC**: Area under precision-recall curve (main metric -- handles class imbalance)
- **AUC-ROC**: Area under receiver operating characteristic
- **FR (top-100)**: Fraction of immunogenic peptides found in top-100 predictions
- **TTIF (top-20)**: Fraction of top-20 predictions that are truly immunogenic

## Results

### Single-Feature Baselines

| Predictor | AUC-ROC | AUPRC | FR-100 | TTIF-20 | Notes |
|-----------|---------|-------|--------|---------|-------|
| Random | 0.500 | 0.058 | 0.081 | 0.000 | Chance level |
| NetMHCpan affinity (inv.) | 0.747 | 0.150 | 0.351 | 0.200 | Pre-computed in TESLA |
| Binding stability | 0.686 | 0.154 | 0.324 | 0.250 | Hours of pMHC stability |
| Tumor abundance (TPM) | 0.643 | 0.110 | 0.517 | 0.000 | RNA expression level |
| Foreignness | 0.529 | 0.069 | 0.194 | 0.050 | Similarity to microbial peptides |
| Frac. hydrophobic | 0.400 | 0.056 | 0.108 | 0.100 | Hydrophobic residue fraction |
| **MHCflurry presentation** | **0.759** | **0.188** | **0.487** | **0.200** | Binding + processing score |
| MHCflurry affinity (inv.) | 0.755 | 0.135 | 0.405 | 0.150 | Binding only |

### Key Observations

1. **MHCflurry presentation score is the best single predictor** (0.759 AUC-ROC, 0.188 AUPRC). It combines binding affinity with antigen processing prediction, which gives a small edge over raw affinity.

2. **Binding affinity is necessary but insufficient.** Both NetMHCpan and MHCflurry achieve ~0.75 AUC-ROC from binding alone, but AUPRC is only 0.15-0.19. Many peptides bind well to MHC but still don't trigger T-cell responses.

3. **Binding stability is surprisingly informative** (0.686 AUC-ROC, 0.154 AUPRC). Peptide-MHC complexes that last longer on the cell surface are more likely to be recognized by T-cells. This makes biological sense: T-cells need time to scan.

4. **Tumor abundance helps recall but hurts precision.** Highest FR-100 (0.517) but worst TTIF-20 (0.000). High expression means the peptide is abundant, which helps the immune system find it -- but expression alone doesn't determine immunogenicity.

5. **Foreignness and hydrophobicity are near-useless alone.** Foreignness (how different the mutant peptide looks from self) barely beats random. Hydrophobicity is actually anti-predictive (0.400 < 0.500).

6. **The gap is enormous.** Best single feature AUPRC is 0.188. Published TESLA ensemble AUPRC is ~0.28. Perfect prediction would be 1.000. There is massive room for improvement.

## What This Means (Plain Language)

Think of it like a security checkpoint at an airport:

- **MHC binding** = "Can this item fit through the X-ray machine?" Most items can. Being scannable doesn't mean it's dangerous.
- **Presentation** = "Is this item actually visible on the X-ray screen?" Some items bind but aren't properly displayed.
- **Immunogenicity** = "Will the security officer actually flag this item?" Even visible items might look harmless to the officer.

Current tools are good at predicting steps 1 and 2 (will the peptide bind and be displayed?) but bad at step 3 (will the immune system actually respond?). That final step depends on factors like:
- T-cell receptor repertoire (what T-cells does this patient have?)
- Similarity to self-peptides (immune tolerance -- the body learns not to attack itself)
- Peptide-MHC structural dynamics (how the peptide sits in the MHC groove)
- Prior immune exposure history

## Published State-of-the-Art Reference

The original TESLA paper's best ensemble model (combining affinity, stability, abundance, and other features with optimized weights) achieved approximately:
- **AUPRC ~0.28** (our target to match first, then beat)
- **AUC-ROC ~0.80**

This was achieved using a simple weighted combination of features, not deep learning. The paper found that binding affinity, tumor abundance, and binding stability were the three most important features.

## Next Steps

1. **Error analysis**: Examine which specific peptides MHCflurry gets wrong and why
2. **Multi-feature model**: Combine all available TESLA features (logistic regression, random forest)
3. **IEDB-trained model**: Train on the much larger IEDB dataset and evaluate on TESLA
4. **Deep learning**: Use ESM-2 protein language model embeddings (requires GPU)

## Files

- `tools/data_loader.py` -- Data loading utilities for IEDB and TESLA
- `tools/evaluate.py` -- Standardized evaluation metrics
- `tools/baseline_mhcflurry.py` -- MHCflurry and feature baseline runner
- `data/iedb/iedb_human_mhci_tcell.csv` -- Filtered IEDB training data (122K rows)
- `data/tesla/tesla_table_s4.xlsx` -- TESLA benchmark (608 peptides)
