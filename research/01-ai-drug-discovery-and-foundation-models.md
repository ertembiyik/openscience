# AI Drug Discovery & Foundation Models for Cancer (Feb 2026)

*Compiled from web research. All claims should be verified against primary sources.*

---

## 1. Foundation Models for Cell Biology & Drug Discovery

### Google DeepMind / Yale: C2S-Scale 27B (Cell2Sentence-Scale)

A 27-billion-parameter AI model that "reads" single cells' gene expression like sentences. Identified that combining CX-4945 with low-dose interferon increases antigen presentation ~50%, potentially making "cold tumors" treatable with immunotherapy. 10-30% of hits were entirely new candidates.

- **Stage**: Preprint on bioRxiv. Model/code on Hugging Face + GitHub. Lab validation in human neuroendocrine cells.
- **Opportunity**: Fine-tuning on specific cancer types; screening drug combinations
- **Sources**: [Google Blog](https://blog.google/technology/ai/google-gemma-ai-cancer-therapy-discovery/), [MLQ AI](https://mlq.ai/news/google-and-yale-release-cell2sentence-scale-27b-unlocking-novel-cancer-immunotherapy-pathways/)

### Single-Cell Foundation Models (scGPT, CellFM, Geneformer)

- **scGPT**: 33 million cells, published Nature Methods 2024. Cell type annotation, gene network inference, drug perturbation prediction. Tested on pancreatic cancer clinical trial data.
- **CellFM**: 800M parameter model, 100 million human cells. Published Nature Communications 2025. Outperforms scGPT and Geneformer.
- **Geneformer**: Harvard. Better for batch integration.
- **Gap identified by MIT Jameel Clinic**: These models need better cancer-specific benchmarks.
- **Sources**: [scGPT](https://www.nature.com/articles/s41592-024-02201-0), [CellFM](https://www.nature.com/articles/s41467-025-59926-5), [MIT Evaluation](https://github.com/clinicalml/sc-foundation-eval)

---

## 2. Generative AI for Molecule & Protein Design

### MIT Jameel Clinic: BoltzGen

Generates proteins from scratch to bind any biological target. Tested against 26 targets including "undruggable" ones. Nanomolar-level binding for 66% of targets. Built on Boltz-2.

- **Stage**: Preprint bioRxiv (Nov 2025). Experimentally validated in 8 wet lab campaigns. Open-source.
- **Sources**: [MIT News](https://news.mit.edu/2025/mit-scientists-debut-generative-ai-model-that-could-create-molecules-addressing-hard-to-treat-diseases-1125), [bioRxiv](https://www.biorxiv.org/content/10.1101/2025.11.20.689494v1.full)

### POLYGON: Multi-Target Cancer Drug Design (UC San Diego)

AI that designs single molecules hitting multiple cancer targets simultaneously. Generated 32 new drug candidates. Published Nature Communications 2024. Open-source.

- **Sources**: [UC San Diego](https://today.ucsd.edu/story/simulated-chemistry-new-ai-platform-designs-tomorrows-cancer-drugs), [Nature Comms](https://www.nature.com/articles/s41467-024-47120-y)

### Boltz-2: Open-Source Protein Structure + Binding Prediction

MIT + Recursion. Matches AlphaFold3 accuracy, runs 1000x faster than physics-based methods. Single GPU, ~20 seconds per prediction. MIT license (fully free).

- **Sources**: [GitHub](https://github.com/jwohlwend/boltz), [bioRxiv](https://www.biorxiv.org/content/10.1101/2025.06.14.659707v1)

---

## 3. AI-Driven Drug Combination Discovery

### NIH/MIT/UNC: Pancreatic Cancer Synergistic Combinations

Three teams screened 1.6M drug combinations computationally. MIT's graph convolutional network achieved **83% hit rate**. 307 synergistic combinations confirmed. Published Nature Communications 2025.

- **Code**: https://github.com/ncats/PANC1 (Python, PyTorch, RDKit)
- **Sources**: [NCATS](https://ncats.nih.gov/news/news-events/turning-to-ai-nih-scientists-reveal-promising-pancreatic-cancer-drug-combinations), [Nature Comms](https://www.nature.com/articles/s41467-025-56818-6)

---

## 4. Neoantigen Prediction Updates (Directly Relevant)

### NeoTImmuML (2025)

ML model for neoantigen immunogenicity prediction. AUC 0.8707 (cross-validation), **0.8865** on independent test -- outperforms VaxiJen, IEDB Class I predictor, DeepImmuno. Comes with TumorAgDB2.0 database (data from Jan 2024 - May 2025). Open-source with pretrained weights.

- **Sources**: [Frontiers](https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2025.1681396/full)

### NeoPrecis (2025)

Integrates "qualified immunogenicity" AND clonality (how widespread the mutation is across the tumor). Published 2025.

- **Source**: [PubMed](https://pubmed.ncbi.nlm.nih.gov/41577704/)

### Key Trend: Multi-Modal Immunogenicity

The field is converging on integrating: (1) peptide-MHC binding, (2) TCR recognition, (3) clonality, (4) gene expression, (5) proteasomal processing, (6) post-translational modifications. **No tool integrates all of these yet.**

---

## 5. Digital Twin Technology

### University of Michigan: Brain Cancer Metabolic Digital Twin (Jan 2026)

ML-based maps of real-time tumor metabolism in brain cancer patients. CNNs + stoichiometric models. Published Cell Metabolism.

- **Sources**: [U Michigan](https://news.umich.edu/brain-cancer-digital-twin-predicts-treatment-outcomes/), [Cell Metabolism](https://www.cell.com/cell-metabolism/fulltext/S1550-4131(25)00482-6)

---

## 6. AI Clinical Trial Optimization

### Mount Sinai: PRISM Platform (Jan 2026)

AI reads patient EHRs and matches to eligible clinical trials. Only 5-7% of cancer patients currently enroll in trials. Uses OncoLLM (cancer-specific LLM). Deployed January 2026.

- **Sources**: [Mount Sinai](https://www.mountsinai.org/about/newsroom/2026/mount-sinai-launches-ai-powered-clinical-trial-matching-platform-to-expand-access-to-cancer-research)

---

## 7. AI-Designed Drugs in Clinical Trials

### Insilico Medicine

Two AI-designed cancer drugs now in **Phase I** clinical trials:
1. ISM6331 (pan-TEAD inhibitor) -- global multicenter Phase I
2. ISM3412 (MAT2A inhibitor) -- Phase I started June 2025

$888M collaboration with Servier for oncology drug discovery.

### Oxford Drug Design

AI-designed molecule targeting leucyl-tRNA synthetase showed **60% life extension** in mouse colorectal cancer models with no detectable toxicity. Outperformed rapamycin in KRAS-mutant tumors.

- **Sources**: [PharmaTimes](https://pharmatimes.com/uncategorized/oxford-drug-design-reports-major-in-vivo-milestone-for-novel-cancer-therapy/)
