# Immunotherapy, Cancer Reprogramming & Synthetic Biology (Feb 2026)

*Compiled from web research. All claims should be verified against primary sources.*

---

## 1. In Vivo CAR-T Cell Generation (MAJOR BREAKTHROUGH)

### Landmark: LNP-Delivered mRNA CAR-T In Vivo (Science, June 2025)

Instead of extracting patient T-cells, engineering them in a lab, and putting them back (current $300K+ process), researchers injected targeted lipid nanoparticles (tLNPs) carrying mRNA directly into the body. The LNPs find CD8+ T-cells and reprogram them into CAR-T cells in situ.

**Results**: Tumor control in humanized mice, B cell depletion in monkeys. Could reduce manufacturing costs by >50%. Eliminates lymphodepleting chemo requirement.

**Also**: NCtx system -- first LNP-based DNA delivery to T-cells for permanent CAR integration (vs. transient mRNA).

- **Sources**: [Science](https://www.science.org/doi/10.1126/science.ads8473), [Nature Reviews Drug Discovery](https://www.nature.com/articles/s41573-025-01291-5)

---

## 2. Cancer Cell Reprogramming

### 2a. BENEIN Framework (KAIST, Updated)

Boolean Network Inference and Control. Models gene interactions as on/off switches. Finds master switches to reset cancer cells to normal. Published Advanced Science Jan 2025.

**Results for colorectal cancer**: MYB, HDAC2, FOXA2 identified as master regulators. Simultaneous knockdown reverted cancer cells into normal enterocytes. Validated in vitro AND in vivo (mice had much smaller tumors).

- **Sources**: [Advanced Science](https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.202402132)

### 2b. CANDiT: AI-Driven Differentiation Therapy (UC San Diego) -- NEW

ML tool that scans the entire genome across 4,600+ tumors to find networks for forcing cancer cells to differentiate. Published Cell Reports Medicine, October 2025.

**Results for colorectal cancer**: Found PRKAB1 as unexpected target. Existing drug activated PRKAB1, restored CDX2 function, cancer stem cells chose to self-destruct. **Could reduce recurrence/death by 50%** (FLAG: verify against paper -- bold press release claim).

Being deployed across: pancreatic, esophageal, gastric, biliary cancers.

- **Sources**: [Cell Reports Medicine](https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(25)00494-X), [UC San Diego](https://today.ucsd.edu/story/precision-reprogramming-how-ai-tricks-cancers-toughest-cells)

### 2c. Cancer Reversion Therapy Review (Dec 2025)

Comprehensive catalog of all approaches: epigenetic reprogramming, microenvironment manipulation, differentiation therapy, oncogene addiction targeting.

- **Source**: [MDPI](https://www.mdpi.com/1467-3045/47/12/1049)

---

## 3. Drug Combination Prediction

### 3a. NIH NCATS/MIT/UNC Pancreatic Cancer Pipeline

(See 01-ai-drug-discovery doc for details)

- **Code**: https://github.com/ncats/PANC1
- 83% hit rate with graph convolutional networks

### 3b. ML for Relapsed AML Drug Combinations

Uses single-cell RNA-seq from actual patient tumors (not cell lines) to predict drug combos. Published Cancer Research (AACR, 2025).

- **Sources**: [Cancer Research](https://aacrjournals.org/cancerres/article/85/14/2753/763446/A-Machine-Learning-Based-Strategy-Predicts)

### 3c. Explainable AI for Synergy (LLM + RAG)

LLM with retrieval-augmented generation that predicts synergy AND explains WHY using biological mechanisms. F1 score 0.80 on 50K+ drug pair assays.

- **Source**: [MDPI](https://www.mdpi.com/1718-7729/32/10/548)

### 3d. Open-Source Drug Synergy Tools

| Tool | Description | GitHub |
|------|-------------|--------|
| SynerGNet | GNN for drug synergy prediction | github.com/MengLiu90/SynerGNet |
| GraphSynergy | GCN + attention, explainable | github.com/JasonJYang/GraphSynergy |
| SynergyGraph | Knowledge graph + hypergraph (2025) | github.com/LBBSoft/SynergyGraph |
| UniSyn | Multi-modal, published Genome Biology 2026 | See paper |

**Key databases**: DrugComb (740K experiments), NCI-ALMANAC, DrugCombDB

---

## 4. Synthetic Biology for Cancer

### 4a. Senti Bio SENTI-202: Logic-Gated CAR-NK -- IN CLINICAL TRIALS

NK cells with Boolean logic circuits: "Kill CD33+ OR FLT3+ cells, BUT NOT EMCN+ cells." First-of-kind in human trials.

**Phase 1 results**: 71% response rate in relapsed AML. MRD-negative complete remissions in 2/3 patients. Off-the-shelf (not patient-specific). FDA RMAT designation Dec 2025.

- **Sources**: [Senti Bio](https://investors.sentibio.com/news-releases/news-release-details/senti-bios-senti-202-first-class-shelf-logic-gated-selective/)

### 4b. MIT Programmable Synthetic Transcription Factors

11 programmable switches for human immune cells. Activated by FDA-approved small molecules. Enables remote on/off control of cellular programs. Published April 2025.

- **Sources**: [MIT News](https://news.mit.edu/2025/equipping-living-cells-with-logic-gates-fighting-cancer-0418)

### 4c. KAIST In Vivo CAR-Macrophage Generation (Jan 2026)

Nanoparticles injected directly into tumors reprogram local macrophages into CAR-macrophages on the spot. Published ACS Nano.

- **Sources**: [ScienceDaily](https://www.sciencedaily.com/releases/2026/01/260110211207.htm)

---

## 5. Antibody/Protein Design

### 5a. RFantibody: De Novo Antibody Design (Baker Lab, Nature Nov 2025)

Designs completely new antibodies from scratch. Atomic accuracy confirmed by cryo-EM. MIT license, fully open-source.

**Cancer applications**: HER2-targeting minibinders (3x higher affinity, 3x smaller than existing drugs). Nanoantibodies targeting PCNA and BCL6.

- **Open-source**: https://github.com/RosettaCommons/RFantibody
- **Sources**: [Nature](https://www.nature.com/articles/s41586-025-09721-5)

### 5b. AI for Antibody-Drug Conjugates (ADCs)

15 FDA-approved ADCs by 2025. AI optimizing: DAR prediction, conjugation sites, paratope prediction, next-gen formats (bispecific ADCs, degrader-based ADCs).

### 5c. Northwestern: Unmasking Pancreatic Cancer's Sugar Disguise

Discovered cancer cells use sugar coating on integrin a3b1 to signal Siglec-10 on immune cells ("stand down"). Antibody blocking this signal restored immune activity. Validated in two animal models.

- **Sources**: [Northwestern](https://news.feinberg.northwestern.edu/2025/11/04/new-antibody-therapy-reawakens-immune-system-to-fight-pancreatic-cancer/)

---

## 6. Tumor Microenvironment Modeling

### TumorTwin (Open-Source Digital Twin Framework)

- **GitHub**: https://github.com/OncologyModelingGroup/TumorTwin
- Computational framework for simulating tumor dynamics

### PhysiCell (Agent-Based Tumor Simulator)

- **GitHub**: https://github.com/MathCancer/PhysiCell
- Models individual cells and their interactions in tumor microenvironment

### PLOS Biology Review: Next-Gen Computational Tumor Models (2025)

Maps challenges and opportunities. Identifies need for multi-scale models, patient-specific data integration, standardized validation.

- **Source**: [PLOS Biology](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3003269)
