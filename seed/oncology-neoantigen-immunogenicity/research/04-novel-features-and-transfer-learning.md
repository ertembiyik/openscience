# Novel Features & Transfer Learning Experiments

*Date: 2026-02-08 | Status: Complete*

## What We Tried

Three approaches to break past the 0.212 AUPRC ceiling from our Phase 2 multi-feature baseline:

1. **Novel position-aware features** -- using known HLA anchor positions and TCR contact positions to create biologically-informed features
2. **Transfer learning from IEDB** -- training on 48K IEDB examples and scoring TESLA
3. **Hybrid model** -- combining IEDB transfer scores + TESLA binding features + mutation site properties


## Experiment 1: Position-Aware Feature Engineering

### Hypothesis
Mutations at TCR-facing positions (center of peptide) should affect immunogenicity differently than mutations at MHC anchor positions (positions 2 and C-term). This is the core insight from NeoaPred's structure-based approach -- we tried to capture it with tabular features.

### Features Computed (27 total)
- **Position-aware** (6): mut_at_anchor, mut_at_tcr_contact, mut_at_p2, mut_at_cterm, mut_position_normalized, mut_distance_from_center
- **Mutation site properties** (5): hydrophobicity, molecular weight, charge, aromaticity, polarity of the mutant residue
- **Context features** (4): hydrophobicity/charge of flanking residues, hydrophobicity contrast, charge break
- **Global peptide features** (7): mean/std hydrophobicity, net charge, aromaticity count, polar fraction, sequence entropy
- **TCR surface features** (4): hydrophobicity, charge, aromaticity, polarity of TCR-facing residues

### Results

| Model | AUC-ROC | AUPRC | FR-100 | TTIF-20 |
|-------|---------|-------|--------|---------|
| RF (Novel features only) | 0.571 | 0.080 | 0.216 | 0.100 |
| GB (Novel features only) | 0.508 | 0.072 | 0.189 | 0.050 |
| RF (Novel + MHCflurry) | 0.732 | 0.202 | 0.432 | **0.350** |
| GB (Novel + MHCflurry) | 0.693 | 0.200 | **0.514** | 0.300 |
| RF (ALL 38 features) | 0.737 | 0.184 | 0.487 | 0.300 |
| GB (ALL 38 features) | 0.731 | 0.186 | 0.487 | **0.350** |

### Verdict: NEGATIVE RESULT

**Novel features alone are near-useless** (0.57 AUC-ROC, 0.08 AUPRC). Amino acid property tables and position indicators cannot predict immunogenicity. The information is too coarse.

**When combined with MHCflurry**, the novel features don't improve AUPRC (0.202 vs 0.212 baseline). However, they do improve ranking at practical cutoffs:
- GB (Novel + MHCflurry) achieves the **best FR-100 = 0.514** (finding 51.4% of immunogenic peptides in top 100)
- Several models achieve **TTIF-20 = 0.350** (7 of top-20 truly immunogenic), up from 0.250

### What This Means
Simple tabular features have been **exhausted**. The immunogenicity signal that separates good binders from actual immune targets requires either:
- Learned sequence representations (ESM-2 embeddings)
- 3D structural information (NeoaPred approach)
- Much richer training data (the Immunity 2023 harmonized dataset with 46K mutations)


## Experiment 2: IEDB Transfer Learning

### Hypothesis
IEDB has 48K labeled peptide-allele pairs (26.7% positive). Training a sequence-based model on this large dataset and transferring to TESLA could provide signal that the 608-peptide TESLA dataset alone can't learn.

### Results

| Model | AUC-ROC | AUPRC | FR-100 | TTIF-20 | Notes |
|-------|---------|-------|--------|---------|-------|
| IEDB pan-allele RF | **0.477** | 0.070 | 0.189 | 0.050 | **Worse than random!** |
| IEDB A*02:01-specific RF | **0.729** | 0.141 | **0.667** | 0.150 | Good on A*02:01 subset |

### Verdict: MIXED

**Pan-allele IEDB model completely fails** on TESLA (0.48 AUC < 0.50 random). The domain shift between general T-cell assays and tumor neoantigen immunogenicity is too large for sequence features to bridge.

**Allele-specific IEDB model works decently** on the A*02:01 subset: 0.73 AUC-ROC is comparable to NetMHCpan binding features, and the FR-100 of 0.667 (finding 66.7% of A*02:01 immunogenic peptides) is the best single model for that subset.

### Key Insight About IEDB
IEDB's "immunogenicity" label comes from diverse experimental assays (ELISpot, tetramer staining, chromium release, etc.) in diverse contexts (viral, bacterial, tumor, autoimmune). This is fundamentally different from TESLA's gold standard (multimer-validated T-cell binding from patient-matched samples). The IEDB-trained model learns "general peptide immunogenicity" which is NOT the same as "tumor neoantigen immunogenicity."


## Experiment 3: Hybrid Model

### Hypothesis
Combining IEDB transfer scores with TESLA binding features and mutation site properties might capture complementary signals.

### Features (13 total)
- TESLA binding: predicted_affinity, binding_stability, tumor_abundance, agretopicity
- MHCflurry: presentation, affinity, processing scores
- IEDB: pan-allele sequence-based immunogenicity score
- Mutation site: BLOSUM self-score, amino acid rarity, hydrophobicity, charge, size

### Results

| Model | AUC-ROC | AUPRC | FR-100 | TTIF-20 |
|-------|---------|-------|--------|---------|
| Hybrid RF | **0.758** | 0.201 | 0.405 | **0.350** |
| Hybrid GB | 0.688 | 0.194 | 0.405 | 0.300 |

### Per-Patient Results (Hybrid RF)

| Patient | AUC-ROC | AUPRC | n_immunogenic | vs Previous Best |
|---------|---------|-------|---------------|-----------------|
| Patient 10 | **0.948** | **0.632** | 3 | +0.192 improvement |
| Patient 3 | 0.831 | **0.516** | 13 | +0.035 improvement |
| Patient 1 | **0.831** | **0.415** | 9 | +0.205 improvement! |
| Patient 2 | 0.844 | 0.239 | 4 | -0.096 worse |
| Patient 12 | 0.603 | 0.137 | 4 | -0.171 worse |
| Patient 16 | 0.577 | 0.043 | 4 | -0.012 worse |

### Feature Importance (Hybrid RF)
1. MHCflurry affinity (16.6%)
2. NetMHCpan affinity (14.3%)
3. MHCflurry presentation (13.7%)
4. MHCflurry processing (10.1%)
5. Binding stability (9.8%)
6. Tumor abundance (8.2%)
7. Agretopicity (6.6%)
8. **IEDB score (6.0%)** -- the transfer signal contributes!
9. **Amino acid rarity (5.1%)** -- rare AAs at mutation site matter
10. Mutation residue hydrophobicity (3.4%)

### Verdict: INCREMENTAL

The hybrid model doesn't beat our previous best on aggregate AUPRC (0.201 vs 0.212). But:
- **IEDB score contributes 6% feature importance** -- it adds complementary signal
- **Amino acid rarity contributes 5%** -- the "unusualness" of the mutant residue matters
- **Dramatic per-patient improvements** for Patients 1, 3, and 10 (but at the cost of Patients 2, 12, 16)
- **TTIF-20 = 0.350** -- best precision at top-20 rankings


## Summary of All Results

| Model | AUC-ROC | AUPRC | FR-100 | TTIF-20 | Source |
|-------|---------|-------|--------|---------|--------|
| Random | 0.500 | 0.058 | 0.081 | 0.000 | Phase 2 |
| MHCflurry single | 0.759 | 0.188 | 0.487 | 0.200 | Phase 2 |
| **RF (TESLA + MHCflurry)** | **0.738** | **0.212** | 0.432 | 0.250 | Phase 2 |
| RF (Novel + MHCflurry) | 0.732 | 0.202 | 0.432 | 0.350 | This doc |
| GB (Novel + MHCflurry) | 0.693 | 0.200 | **0.514** | 0.300 | This doc |
| Hybrid RF | 0.758 | 0.201 | 0.405 | 0.350 | This doc |
| *Published TESLA ensemble* | *~0.80* | *~0.28* | *--* | *--* | Wells 2020 |

**Best AUPRC**: RF (TESLA + MHCflurry) = 0.212
**Best FR-100**: GB (Novel + MHCflurry) = 0.514
**Best TTIF-20**: Multiple models at 0.350
**Best AUC-ROC**: MHCflurry single = 0.759

## What We've Proven

1. **Tabular features are saturated.** 27 novel features including position-awareness, amino acid properties, context, and TCR surface properties add negligible signal to binding predictors. The gap between 0.212 and 0.28+ cannot be closed by engineering more tabular features.

2. **IEDB transfer requires domain adaptation.** Raw IEDB models fail on TESLA (domain shift). But IEDB scores as a feature contribute 6% importance, suggesting the transfer works better as an auxiliary signal than a primary one.

3. **Per-patient variation dominates.** Patient 10 achieves 0.632 AUPRC while Patient 16 gets 0.043. No model architecture we've tried changes this pattern. Patient-level factors (HLA repertoire, TCR diversity, tumor mutation burden) may be more important than better global models.

4. **Mutation site properties add small but real signal.** Amino acid rarity (5% importance) and mutant residue properties contribute, confirming that WHAT the mutation changes to matters, not just WHERE it is.

## What's Needed to Break Through to 0.28+

Based on literature review and our experiments, the remaining gap requires:

### Must Have (any one could close the gap)
1. **Structural features** -- NeoaPred achieves 0.54 AUPRC by modeling peptide-HLA 3D structure and comparing mutant vs wild-type surfaces. Requires GPU + setup of molecular modeling software.
2. **ESM-2 mutant-vs-WT embedding differences** -- Embed both mutant and WT peptides with ESM-2, compute the DIFFERENCE vector. This captures structural changes implicitly. Requires GPU (650M parameter model).
3. **Transfer learning from binding prediction** -- Train a neural network on IEDB binding data (100K+ examples), fine-tune on immunogenicity. The BigMHC/ImmugenX approach. Requires GPU.

### Nice to Have
4. **Wild-type peptide reconstruction** -- Search the human reference proteome to find the WT amino acid at each mutation position. Enables richer mutant-vs-WT features.
5. **Harmonized training data** -- The Immunity 2023 paper showed better data curation improves predictions by 30%. Access their harmonized dataset.
6. **Per-patient calibration** -- Adjust predictions based on patient-specific features (HLA allele coverage, mutation burden).

### GPU Requirements
- **Minimum**: T4 GPU (16GB VRAM) -- sufficient for ESM-2 inference and basic model training
- **Recommended**: A100 (40GB) -- allows full NeoaPred pipeline and larger batch training
- All three "must have" approaches require GPU


## Files

- `tools/feature_engineering.py` -- Novel position-aware feature computation
- `tools/iedb_transfer.py` -- IEDB transfer learning + hybrid model
- `research/04-novel-features-and-transfer-learning.md` -- This document
