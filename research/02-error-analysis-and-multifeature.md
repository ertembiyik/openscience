# Error Analysis & Multi-Feature Baselines

*Date: 2026-02-08 | Status: Complete*

## Part 1: Error Analysis -- Where MHCflurry Fails

### Setup

Used MHCflurry presentation score (best single predictor: 0.759 AUC-ROC, 0.188 AUPRC) and ranked all 608 TESLA peptides. Then examined which immunogenic peptides it misses (false negatives) and which non-immunogenic peptides it falsely promotes (false positives).

### Key Finding: MHCflurry's ranking is mediocre

- **Median rank of immunogenic peptides: 103 / 608** (should be close to 1 if model were perfect)
- Median rank of non-immunogenic peptides: 317 / 608
- 19 out of 37 immunogenic peptides ranked **outside the top 100** (51% miss rate)
- Only 4 immunogenic peptides in the top 20 (16 of top 20 are false positives)

### False Negatives: What MHCflurry Misses

The 19 immunogenic peptides that MHCflurry misses (ranked >100) share patterns:

| Pattern | Missed Immunogenic (FN) | Detected Immunogenic (TP) | Interpretation |
|---------|------------------------|--------------------------|---------------|
| Binding affinity (nM) | 55.5 | 10.2 | FN have **weaker binding** (5.5x higher nM) |
| Binding stability (hrs) | 5.3 | 19.5 | FN have **3.7x less stable** pMHC complexes |
| Tumor abundance (TPM) | 40.5 | 81.3 | FN have **half the expression** |
| MHCflurry score | 0.74 | 0.99 | FN score much lower (by definition) |

**Translation**: MHCflurry misses immunogenic peptides that bind less tightly to MHC. But weaker binders CAN be immunogenic -- they just need other properties (e.g., strong T-cell receptor recognition) that MHCflurry doesn't model.

The worst miss: **KLLSFHSV** (HLA-A*02:01, Patient 16) -- ranked 554th! It has decent binding (160 nM), decent stability (20 hrs), but very low tumor expression (1.3 TPM). Despite all that, it IS immunogenic. Something about its sequence triggers T-cells that binding metrics alone can't capture.

### False Positives: What MHCflurry Falsely Promotes

The top-20 includes 16 non-immunogenic peptides. They ALL have:
- Extremely strong binding (affinity 2.6-81.9 nM, most < 25 nM)
- Good stability (many > 10 hours)
- MHCflurry scores > 0.98

**Translation**: MHCflurry's top predictions are dominated by "super-binders" -- peptides that stick incredibly well to MHC molecules. But strong binding does NOT guarantee T-cell recognition. Many of these peptides are probably too similar to normal human peptides (self-tolerance), or the T-cell receptor just doesn't recognize the peptide-MHC shape.

### Per-Patient and Per-Allele Patterns

**By patient** (fraction of immunogenic peptides found in top-100):
| Patient | Detection Rate | Total Peptides | Notes |
|---------|---------------|----------------|-------|
| Patient 2 | 4/4 (100%) | 108 | Best -- all 4 immunogenic found |
| Patient 10 | 2/3 (67%) | 73 | Good |
| Patient 16 | 2/4 (50%) | 144 | Medium |
| Patient 1 | 4/9 (44%) | 97 | Below average |
| Patient 3 | 5/13 (38%) | 97 | Worst -- has most immunogenic peptides but MHCflurry misses 8 |
| Patient 12 | 1/4 (25%) | 89 | Very poor |

**Patient 3** is the hardest case -- 13 immunogenic peptides (most of any patient) and MHCflurry only catches 5 of them. Many of Patient 3's immunogenic peptides are presented on HLA-A*03:01, where MHCflurry seems to perform worse.

**By HLA allele**:
- HLA-A*02:01: 6/12 found (50%) -- this is the most common allele, but only medium performance
- HLA-A*03:01: 4/11 found (36%) -- **worst performance**, and these are all Patient 3's peptides
- HLA-B alleles: mostly 0/1 found -- too few examples, but HLA-B seems harder
- HLA-A*68:01, HLA-A*24:02: 100% found -- but only 1-2 examples each

### Feature Comparison: Immunogenic vs Non-Immunogenic

| Feature | Immunogenic Mean | Non-Immunogenic Mean | Ratio | Direction |
|---------|-----------------|---------------------|-------|-----------|
| Binding affinity (nM) | 48.8 | 418.2 | 0.12 | Immunogenic bind **8x stronger** |
| Binding stability (hrs) | 10.2 | 4.1 | 2.52 | Immunogenic are **2.5x more stable** |
| Tumor abundance (TPM) | 39.9 | 32.7 | 1.22 | Slightly higher expression |
| Hydrophobic fraction | 0.35 | 0.40 | 0.88 | Immunogenic are **less** hydrophobic |
| Foreignness | 0.04 | 0.10 | 0.41 | Immunogenic are **less** foreign (?!) |
| Agretopicity | 0.70 | 0.62 | 1.13 | Slightly higher mutant/WT ratio |
| MHCflurry presentation | 0.85 | 0.62 | 1.38 | Higher presentation score |
| MHCflurry affinity (nM) | 116.7 | 1203.0 | 0.10 | **10x stronger binding** |

**Surprises**:
1. **Foreignness is ANTI-predictive** (0.04 vs 0.10) -- immunogenic peptides look LESS foreign to the immune system than non-immunogenic ones. This contradicts the naive expectation that "more different = more immunogenic."
2. **Hydrophobicity is slightly anti-predictive** (0.35 vs 0.40) -- immunogenic peptides are slightly less hydrophobic.
3. **Binding affinity is the strongest single signal** -- 8-10x difference in means, but the distributions overlap heavily (many strong binders are NOT immunogenic).


## Part 2: Multi-Feature Models

### Approach

Used **leave-one-patient-out cross-validation** (LOGO-CV) -- the standard for TESLA evaluation. For each of the 6 patients, train on the other 5, predict on the held-out patient. This tests generalization to new patients, which is what matters clinically.

Tested:
1. **Logistic Regression** with balanced class weights
2. **Random Forest** (500 trees, max_depth=5) with balanced class weights

Two feature sets:
- **TESLA features only**: affinity, stability, abundance, hydrophobicity, agretopicity, foreignness, mutation_position, peptide_length
- **TESLA + MHCflurry**: above + MHCflurry presentation, affinity, processing scores

### Results

| Model | AUC-ROC | AUPRC | FR-100 | TTIF-20 |
|-------|---------|-------|--------|---------|
| Random baseline | 0.500 | 0.058 | 0.081 | 0.000 |
| MHCflurry presentation (single) | **0.759** | 0.188 | 0.487 | 0.200 |
| LR (TESLA features) | 0.730 | 0.176 | 0.459 | 0.250 |
| RF (TESLA features) | 0.696 | 0.139 | 0.297 | **0.350** |
| LR (TESLA + MHCflurry) | 0.737 | 0.197 | 0.487 | 0.250 |
| **RF (TESLA + MHCflurry)** | 0.738 | **0.212** | 0.432 | 0.250 |
| *Published TESLA ensemble* | *~0.80* | *~0.28* | *--* | *--* |

### Key Findings

1. **Random Forest with all features achieves best AUPRC (0.212)** -- 13% improvement over MHCflurry alone (0.188). Adding MHCflurry features helps RF more than LR.

2. **We're still short of the published TESLA ensemble (~0.28 AUPRC)**. The gap is 0.068 AUPRC. The published ensemble likely used more sophisticated feature engineering and possibly different CV strategy.

3. **Feature importance** (from Random Forest):
   - MHCflurry affinity (17.4%) and presentation (16.8%) are top features
   - NetMHCpan affinity (14.8%) and binding stability (11.5%) follow
   - MHCflurry processing (10.0%) adds value beyond binding alone
   - Foreignness (1.0%) and peptide length (1.3%) are nearly useless

4. **Logistic Regression feature coefficients** reveal the model's logic:
   - Strongest predictor: `-1.35 * mhcflurry_affinity` (lower nM = more immunogenic)
   - Second: `-0.92 * mhcflurry_presentation` (negative because of feature scaling interaction)
   - Third: `-0.71 * predicted_affinity`
   - Positive contributors: tumor abundance (+0.41), processing (+0.45), stability (+0.30)

5. **Per-patient performance varies wildly**:

| Patient | Best AUC-ROC | Best AUPRC | n_immunogenic |
|---------|-------------|-----------|---------------|
| Patient 3 | 0.825 | 0.483 | 13 |
| Patient 10 | 0.886 | 0.540 | 3 |
| Patient 2 | 0.798 | 0.335 | 4 |
| Patient 1 | 0.717 | 0.311 | 9 |
| Patient 12 | 0.726 | 0.139 | 4 |
| Patient 16 | 0.602 | 0.077 | 4 |

Patient 16 is the hardest (AUPRC 0.077 -- barely above random). Patient 10 and 3 are easier. This patient-level variation suggests that some patients' immune responses are more predictable than others, possibly due to HLA allele differences or T-cell repertoire diversity.


## Bottom Line

### What works
- Binding affinity is the foundation (~0.75 AUC-ROC from this alone)
- Combining multiple features helps (0.212 vs 0.188 AUPRC)
- Binding stability adds real signal beyond affinity
- MHCflurry processing score adds value

### What doesn't work
- Foreignness is anti-predictive or useless
- Hydrophobicity is slightly anti-predictive
- Simple ML on available features can't close the gap to published SOTA

### What's missing (the gap to 0.28+ AUPRC)
1. **Sequence-level features**: Current features are all scalar summaries. The actual amino acid sequence contains information about T-cell receptor recognition that no single number captures.
2. **Self-similarity**: How similar is the mutant peptide to normal human peptides? The foreignness score tries this but clearly doesn't capture the right notion of similarity.
3. **Structural features**: How does the peptide sit in the MHC groove? Which residues are exposed to T-cell receptors?
4. **Protein language model embeddings**: ESM-2 or similar models capture evolutionary/structural information from sequence alone.

These gaps point directly to Phase 4: we need sequence-level features, likely from protein language models.


## Files

- `tools/error_analysis_and_multifeature.py` -- Full analysis script
- `research/02-error-analysis-and-multifeature.md` -- This document
