# Early Detection, Medical Imaging & Multi-Omics (Feb 2026)

*Compiled from web research. All claims should be verified against primary sources.*

---

## 1. Liquid Biopsy & Early Cancer Detection

### 1.1 Grail's Galleri (Multi-Cancer Early Detection)

Blood test detecting 50+ cancer types from cell-free DNA methylation patterns. NHS is running a 140,000-person trial (NHS-Galleri). FDA Breakthrough Device designation. Specificity >99.5%, sensitivity varies by stage (17% stage I up to 90% stage IV).

- **Sources**: [WEF](https://www.weforum.org/stories/2025/02/cancer-treatment-and-diagnosis-breakthroughs/)

### 1.2 DELFI (DNA Evaluation of Fragments for Early Interception)

Analyzes fragmentation patterns of cell-free DNA (cfDNA). The idea: cancer cells release DNA that breaks differently than healthy cells. Uses shallow whole-genome sequencing (cheaper than deep sequencing). Detected lung cancer with 94% sensitivity at 80% specificity in high-risk individuals.

- **Open-source**: https://github.com/cancer-genomics/delfi_scripts
- **Sources**: [Nature](https://www.nature.com/articles/s41586-023-06452-z)

### 1.3 FinaleToolkit: Open-Source cfDNA Fragmentomics

Python package for extracting fragmentation features from cfDNA. 50x speed improvement over existing tools. Published in Bioinformatics Advances.

- **Open-source**: Published, documented, pip installable
- **Sources**: [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11160763/)

### 1.4 Flomics: RNA-Based Liquid Biopsy (Barcelona)

Analyzes cell-free RNA (cfRNA) instead of DNA. 92% AUC across 5 cancer types. **80% sensitivity for Stage I cancers** (exceptional). Tested on 1,000+ patient samples from 8 hospitals. Market entry planned 2027.

- **Sources**: [Flomics](https://www.flomics.com/2025/01/31/breakthrough-liquid-biopsy-rna-ai-enable-multicancer-early-detection/)

### 1.5 Exosome/Extracellular Vesicle AI Analysis

Tiny bubbles released by cancer cells carrying proteins/RNA. Combined with AI for multi-cancer detection. Breast cancer: 98% sensitivity, 96% specificity. 58 active clinical trials on EVs in cancer.

---

## 2. Digital Pathology AI

### 2.1 Foundation Models for Pathology

**UNI 2.0 (Harvard/BWH)**: Self-supervised model trained on 200M+ pathology images. SOTA on 20+ benchmarks. Open-source: https://github.com/mahmoodlab/UNI

**CONCH (Harvard/BWH)**: Vision-language pathology model. Understands images AND text. Published Nature Medicine. Open-source: https://github.com/mahmoodlab/CONCH

**PathChat (Harvard/BWH)**: Multimodal AI copilot for pathology -- ChatGPT for pathology slides. FDA Breakthrough Device Designation. Published Nature 2024.

**Virchow (Paige + Microsoft)**: 1.5M+ slides. Largest pathology model.

### 2.2 FDA-Cleared Pathology AI

- **Paige Prostate**: First FDA-cleared AI tool for pathology
- **Paige PanCancer Detect**: FDA Breakthrough Device Designation (April 2025) -- multi-tissue cancer detection
- **Galen Second Read (Ibex)**: FDA-cleared clinical pathology AI

### 2.3 Open Pathology Datasets

- TCGA pathology slides: ~30,000 slides, 33 cancer types (free via GDC)
- CAMELYON16/17: Breast cancer metastasis detection benchmark
- PANDA Challenge: Prostate cancer grading
- NCT-CRC-HE-100K: 100K colorectal cancer patches

---

## 3. Radiomics & AI Medical Imaging

### 3.1 Pillar-0: Open-Source Radiology Foundation Model

UC Berkeley + UCSF. Processes FULL 3D CT/MRI volumes. Recognizes 350+ conditions. **0.87 AUC** -- outperforms Google's MedGemma, Microsoft's MI2, Alibaba's Lingshu. Trained on 160K+ scans.

- **Open-source**: https://yalalab.github.io/pillar-0/
- **Sources**: [UC Berkeley](https://cdss.berkeley.edu/news/uc-berkeley-and-ucsf-researchers-release-top-performing-ai-model-medical-imaging)

### 3.2 MedSAM / MedSAM2

Adapts Meta's SAM for medical images. Segments tumors automatically from prompts. Trained on 1.57M images across 10 modalities, 30+ cancer types. Reduces annotation time by 82%.

- **Open-source**: https://github.com/bowang-lab/MedSAM, https://github.com/bowang-lab/MedSAM2

### 3.3 Lung CT Foundation Models

- **LCTfound**: 105K CT scans, 28M+ images. Supports 8 tasks. Published Nature Communications 2025.
- **TANGERINE**: Computationally frugal, open-source. 98K+ thoracic CTs. Can fine-tune with limited compute.

---

## 4. Cancer Genomics & Multi-Omics

### 4.1 Flexynesis (Berlin, Max Delbruck Center)

Deep learning toolkit for multi-omics integration. Predicts drug response, cancer subtype, survival. Supports GCN, VAE, transformers. Published Nature Communications Sep 2025.

- **Open-source**: https://github.com/BIMSBbioinfo/flexynesis

### 4.2 Graph Neural Networks for Drug Response

| Tool | Description | GitHub |
|------|-------------|--------|
| DeepCDR | Hybrid GCN for drug response | github.com/kimmo1019/DeepCDR |
| GraphCDR | GNN + contrastive learning | github.com/BioMedicalBigDataMiningLab/GraphCDR |
| CancerOmicsNet | Heterogeneous omics GNN | github.com/pulimeng/CancerOmicsNet |
| ASGCL | Adaptive sparse graph for drug response | PLOS Comp Bio 2025 |

### 4.3 Spatial Transcriptomics

Preserves WHERE in tissue each cell is. Revolutionary for tumor microenvironment understanding.

- **Key tools**: Scanpy, Seurat v5, Cell2location, CellChat
- **New in 2025**: Spatial Touchstone (global data standardization), SpatialQM (quality metrics)
- **AI approaches**: Graph NNs for cell-cell interactions, foundation models for spatial biology (very early)
- **Major opportunity**: Tools are immature. Production-quality engineering would have outsized impact.

---

## 5. Key Open Datasets

| Dataset | Contents | Size | Access |
|---------|----------|------|--------|
| TCGA | Pan-cancer multi-omics + pathology slides | 20K+ patients, 2.5 PB | Open (GDC) |
| GDC | 60+ cancer research projects | 2.9 PB | Open |
| HTAN | Single-cell + spatial tumor atlases | 14 atlases, 66 organs | Open portal |
| IEDB | Immune epitope database | Millions | Open |
| GEO | Gene expression datasets | 200K+ datasets | Open |
| GDSC | Drug sensitivity in cancer cell lines | 1K+ cell lines | Open |
| CCLE | Cancer cell line genomic profiles | 1K+ lines | Open |
| FinaleDB | cfDNA fragmentation database | Multiple studies | Open |
| DrugComb | Drug combination experiments | 740K experiments | Open |
| NCI-ALMANAC | Drug combination screening | Large-scale | Open |

---

## 6. Active Competitions & Challenges

- **FeTS Challenge** (Federated Tumor Segmentation): Brain tumor segmentation across 32 institutions. Published Nature Communications 2025. GitHub: https://github.com/FeTS-AI/Challenge
- **FLARE 2025**: Pan-cancer segmentation challenge (MedSAM2 baseline)
- **DREAM Challenges**: Various cancer ML benchmarks (ongoing)
