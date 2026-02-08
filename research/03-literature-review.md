# Literature Review: Neoantigen Immunogenicity Prediction (2022-2026)

*Date: 2026-02-08 | Status: Complete*

## The Problem We're Solving

Given a tumor mutation and a patient's HLA type, predict whether the resulting mutant peptide will trigger a T-cell immune response. This is the #1 bottleneck in personalized mRNA cancer vaccines: you need to pick the right neoantigens to encode in the vaccine.

**Our baseline**: Random Forest on TESLA features + MHCflurry = 0.738 AUC-ROC, 0.212 AUPRC.
**Our target**: Published TESLA ensemble ~0.80 AUC-ROC, ~0.28 AUPRC.
**State of the art**: NeoaPred achieves 0.81 AUC-ROC, 0.54 AUPRC (on their own test set, not TESLA directly).


## Landscape of Approaches

The field has evolved from simple binding predictors to multi-modal deep learning. I organize approaches by their core insight.

### Approach 1: Transfer Learning from Related Tasks

**Key idea**: Immunogenicity data is scarce (~thousands of labeled examples). But related tasks -- binding affinity, eluted ligand presentation, pMHC stability -- have 100x more data. Train on those first, then fine-tune on immunogenicity.

#### BigMHC (Albert et al., Nature Machine Intelligence 2023)
- **Architecture**: Ensemble of 7 pan-allelic deep neural networks with self-attention
- **Input**: One-hot encoded peptide + MHC pseudosequence
- **Training pipeline**: Pre-train on 900K+ mass spectrometry eluted ligands → transfer learn to immunogenicity
- **Results**: 0.9733 AUC-ROC for presentation prediction (excellent), significantly improved immunogenicity precision over 7 SOTA models on TESLA
- **Key insight**: Transfer learning from presentation → immunogenicity works because the features needed to predict "will this peptide be on the cell surface?" overlap with "will T-cells notice it?"
- **Limitation**: Transfer is imperfect -- many presented peptides are not immunogenic
- **Code**: [github.com/KarchinLab/bigmhc](https://github.com/KarchinLab/bigmhc)

#### ImmugenX (Bayat et al., 2024)
- **Architecture**: Modular transformer with separate peptide/MHC branches (4 encoder layers, 72-dim embeddings)
- **Training pipeline**: 4-stage iterative transfer learning:
  1. Binding affinity (99,245 measurements)
  2. Eluted ligand (16.9M pMHC pairs)
  3. pMHC stability (28,088 measurements)
  4. Immunogenicity (final fine-tuning)
- **Results**: 0.619 AUC-ROC, 0.514 Average Precision on cancer-specific holdout (7% improvement over BigMHC)
- **Critical finding about ESM-2**: "There was no benefit from using ESM-2 embeddings compared to our iterative training methods alone." Task-specific pretraining > general protein language model for this problem.
- **Critical finding about TCR**: Adding T-cell receptor information improves predictions, but TCR data is rarely available clinically.
- **Key limitation**: Both ImmugenX and BigMHC have "poor recall" on immunogenic peptides with low predicted binding/stability. These peptides are invisible to binding-first approaches.

**Takeaway for us**: The 4-stage transfer learning pipeline (affinity → ligand → stability → immunogenicity) is the most data-efficient approach. But ESM-2 embeddings alone aren't a silver bullet here.

---

### Approach 2: Structure-Based Features (Mutant vs Wild-Type Comparison)

**Key idea**: Instead of just looking at the mutant peptide sequence, model the 3D structure of the peptide-HLA complex and compare it to the wild-type. Structural differences that change the exposed surface are what T-cells actually "see."

#### NeoaPred (Du Lab, Bioinformatics 2024) -- CURRENT BEST
- **Architecture**: Two-model pipeline:
  1. **PepConf**: AlphaFold2-inspired model that predicts peptide conformation within the HLA groove (82.4% of structures within 1Å RMSD of crystal structures)
  2. **PepFore**: Three parallel CNN+FCNN blocks processing:
     - **Outer surface comparison**: Geometric features (shape index, curvature) + chemical features (hydropathy, electrostatics) between mutant and wild-type surfaces
     - **Spatial structure comparison**: 3D distance matrices between mutant/WT
     - **Atom group comparison**: Character embedding of atom groups through broadcast matrix
- **Training data**: 5,986 immunogenic + 26,976 non-immunogenic pHLA-I pairs from IEDB/IMMA2/literature; 1,018 PDB structures for PepConf
- **Results on own test set** (625 pos, 2,672 neg): **0.81 AUC-ROC, 0.54 AUPRC**
- **Comparison**: BigMHC = 0.70/0.30, SimToIEDB = 0.64/0.40 on the same test set
- **Why it works**: T-cells recognize the EXPOSED SURFACE of the peptide-MHC complex. If the mutation changes what's exposed (electrostatics, hydrophobicity, shape), T-cells are more likely to recognize it as foreign. Sequence-only methods miss these 3D surface changes.
- **Limitation**: Only handles HLA-I. Performance drops for unseen alleles (0.62 AUC-ROC). Computationally expensive (needs structure prediction for every peptide).
- **Code**: [github.com/Dulab2020/NeoaPred](https://github.com/Dulab2020/NeoaPred)

**IMPORTANT CAVEAT**: NeoaPred's 0.81/0.54 numbers are on their own 10% held-out test set (3,297 samples), NOT on the TESLA dataset specifically. Their test set has 625 immunogenic peptides vs TESLA's 37. The numbers are not directly comparable to our TESLA results. We would need to run NeoaPred on TESLA to get a fair comparison.

**Takeaway for us**: Structure-based mutant-vs-wild-type comparison is the most promising direction. The core biological insight is sound: immunogenicity depends on how different the mutant peptide LOOKS on the cell surface, not just whether it binds.

---

### Approach 3: Multi-Modal Feature Integration (Sequence + Scores + Expression)

**Key idea**: Combine everything -- peptide sequence, binding predictions, expression levels, biochemical properties -- into one model.

#### NUCC (Xu et al., 2024)
- **Architecture**: Hybrid CNN + FCNN with two branches (text for sequences, numerical for scores)
- **Features**: Peptide sequence + HLA type + MixMHCpred presentation + NetMHCpan affinity + NetMHCstabpan stability
- **TESLA results**: 5 immunogenic in top-20, 11 in top-50 (out of 37 total)
- **Comparison**: Beats DeepHLApan (3/20), DeepImmuno-CNN (3/20), Seq2Neo-CNN (4/20)
- **Source**: [PMC10793678](https://pmc.ncbi.nlm.nih.gov/articles/PMC10793678/)

#### CNNeoPP (2025)
- **Architecture**: NLP-based encoding (TF-IDF + BioBERT) with multi-modal feature fusion
- **Features**: 11 immunogenicity features across antigen processing, biochemical properties, and T-cell recognition
- **TESLA results**: 3 in top-10, 5 in top-20, 8 in top-50
- **Key difference**: Uses BioBERT protein language model for sequence encoding
- **Source**: [medRxiv 2025.03.22.25324446](https://www.medrxiv.org/content/10.1101/2025.03.22.25324446v1.full)

#### Immunity Harmonized Datasets (Bjerregaard et al., Immunity 2023)
- **What they did**: Reprocessed WES+RNA data from 120 patients (TESLA + NCI + in-house), identified 46,017 mutations and 1,781,445 neo-peptides (212 immunogenic mutations, 178 immunogenic neo-peptides)
- **Key new features discovered**:
  - Protein HLA presentation hotspots (some protein regions are preferentially presented)
  - Binding promiscuity (peptides that bind multiple HLA alleles are more immunogenic)
  - Oncogene role (mutations in oncogenic drivers may be more immunogenic)
- **TESLA results**: Median AUPRC = 0.273, ranked 4th among all TESLA participants. Their ML approach increased immunogenic peptides in top-20 by 30% over standard methods.
- **Source**: [Cell/Immunity 2023](https://www.cell.com/immunity/fulltext/S1074-7613(23)00406-5)

#### NeoTImmuML (2025)
- **Architecture**: Weighted ensemble of LightGBM + XGBoost + Random Forest
- **Features**: 78 physicochemical properties from amino acid sequences
- **Results**: 0.8865 AUC on own external test set
- **Key features by SHAP**: Peptide hydrophilicity and peptide length most important
- **Caveat**: Trained on balanced dataset (50/50), tested on own split -- not clear how this translates to TESLA's 6.1% positive rate
- **Source**: [Frontiers in Immunology 2025](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2025.1681396/full)

---

### Approach 4: ImmunoNX (Workflow, not Model)

ImmunoNX (arxiv 2512.08226) is NOT a predictive model. It's a bioinformatics workflow (WDL on GCP) for clinical neoantigen vaccine design that has supported 185+ patients across 11 trials. It uses pVACtools for prediction and a two-stage immunogenomics review process. Useful as a reference for clinical pipeline design, but not relevant to our modeling work.


## Comparative Summary

| Method | Year | Approach | Test AUC-ROC | Test AUPRC | TESLA-Specific? | Code Available? |
|--------|------|----------|-------------|-----------|-----------------|-----------------|
| Our RF baseline | 2026 | Multi-feature ML | 0.738 | 0.212 | Yes (LOGO-CV) | Yes |
| TESLA ensemble | 2020 | Weighted features | ~0.80 | ~0.28 | Yes | No |
| BigMHC | 2023 | Transfer learning DNN | -- | -- | Partial | Yes |
| Immunity harmonized | 2023 | Harmonized ML | -- | 0.273 | Yes (median) | Partial |
| NeoaPred | 2024 | Structure-based DL | 0.81 | 0.54 | No (own test) | Yes |
| ImmugenX | 2024 | Modular PLM | 0.619 | 0.514 | No (own test) | Partial |
| NUCC | 2024 | CNN+FCNN multi-modal | -- | -- | Yes (5/20 top) | Unclear |
| CNNeoPP | 2025 | NLP + multi-modal | -- | -- | Yes (5/20 top) | Partial |
| NeoTImmuML | 2025 | Ensemble gradient boosting | 0.887 | -- | No (own test) | Unclear |


## Key Lessons for Our Work

### 1. Transfer Learning is Essential
The field has converged on a clear pattern: pre-train on abundant binding/presentation data, then fine-tune on scarce immunogenicity data. BigMHC and ImmugenX both show this works. We should adopt this strategy.

### 2. Structure-Based Features are the Biggest Win
NeoaPred's structural comparison (mutant vs wild-type surface) achieves the highest reported AUPRC. This makes biological sense: T-cells recognize the 3D surface of the peptide-MHC complex, not the sequence directly. The cost is computational (need to predict structures), but the payoff is large.

### 3. ESM-2 Alone Won't Save Us
ImmugenX explicitly found that ESM-2 embeddings don't help when you already have good task-specific pretraining. This is important -- we shouldn't assume that protein language model embeddings are a magic fix. They may help as additional features, but the main gains come from:
- Better features (structural, surface, mutant-vs-WT comparison)
- Better training strategy (transfer learning pipeline)
- Better data (harmonized, larger, cleaner)

### 4. Mutant vs Wild-Type Comparison is Underutilized
NeoaPred's core insight: compare the mutant peptide-HLA complex to the wild-type. The DIFFERENCE is what the immune system sees. Our current features (agretopicity = binding ratio) capture a tiny fraction of this. We should compute richer mutant-vs-WT features.

### 5. Dataset Quality Matters More Than Model Complexity
The Immunity harmonized datasets paper showed that carefully reprocessing and harmonizing data from multiple sources (TESLA + NCI + in-house) improved predictions significantly. Simple ML methods on better data beat complex models on noisy data.

### 6. Per-Patient Variation is the Elephant in the Room
Everyone reports aggregate metrics, but per-patient performance varies wildly. Our data shows AUPRC 0.077-0.540 across patients. The hard patients (Patient 16 in our case) may require patient-specific features (HLA allele-specific models, TCR repertoire information) that no published method handles well.


## Recommended Strategy for Phase 4

Based on this review, our best path forward:

### Step 1: Run NeoaPred on TESLA (quick win, ~1 day)
Clone the NeoaPred repo, run it on our 608 TESLA peptides, get a fair comparison number. This will tell us the true ceiling for structural approaches on TESLA.

### Step 2: Implement Transfer Learning Pipeline (medium effort, ~1 week)
Follow the ImmugenX/BigMHC pattern:
1. Pre-train a small model on binding affinity (IEDB, 122K examples)
2. Fine-tune on eluted ligand data if available
3. Fine-tune on immunogenicity (IEDB positive/negative labels)
4. Evaluate on TESLA

### Step 3: Add Structural Features Without Full Structure Prediction (creative middle ground)
Instead of predicting full 3D structures (expensive), compute proxy structural features:
- MHC anchor residue positions (known from allele motifs)
- Solvent-accessible surface area estimates from sequence (using tools like DSSP or learned predictors)
- Electrostatic/hydrophobicity profiles at TCR-facing positions
- Mutant vs wild-type feature differences at each position

### Step 4: Protein Language Model Features (requires GPU)
Use ESM-2 to embed peptide sequences, but critically:
- Embed BOTH mutant and wild-type peptides
- Use the DIFFERENCE in embeddings as the feature (not raw embeddings)
- This captures the same mutant-vs-WT insight as NeoaPred but without explicit structure prediction

### GPU Requirements
Steps 2-4 will need GPU. ESM-2 (650M parameter model) needs ~3GB VRAM minimum. Training the transfer learning pipeline needs ~8GB VRAM. A single A100 or even a T4 would suffice.


## Sources

- [NeoaPred - Bioinformatics 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11419954/)
- [BigMHC - Nature Machine Intelligence 2023](https://github.com/KarchinLab/bigmhc)
- [ImmugenX - PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11581412/)
- [NUCC - PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10793678/)
- [CNNeoPP - medRxiv 2025](https://www.medrxiv.org/content/10.1101/2025.03.22.25324446v1.full)
- [NeoTImmuML - Frontiers 2025](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2025.1681396/full)
- [Harmonized Datasets - Immunity 2023](https://www.cell.com/immunity/fulltext/S1074-7613(23)00406-5)
- [ImmunoNX - arxiv 2512.08226](https://arxiv.org/abs/2512.08226)
- [ESM-MHC - ACM 2024](https://dl.acm.org/doi/10.1145/3674658.3674674)
- [TCR-ESM - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S200103702300452X)
