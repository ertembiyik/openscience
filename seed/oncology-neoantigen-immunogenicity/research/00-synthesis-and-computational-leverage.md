# Research Synthesis & Computational Leverage Analysis

*Compiled: 2026-02-08 | Sources: Web research + training knowledge | Status: LIVING DOCUMENT*

---

## Executive Summary

We investigated 4 global cancer treatment tracks. Here's the honest ranking by **computational leverage** -- where our SWE + AI skills can contribute most:

| Rank | Track | Computational Leverage | Maturity | Our Fit |
|------|-------|----------------------|----------|---------|
| 1 | **mRNA Cancer Vaccines (Neoantigen Prediction)** | VERY HIGH | Phase II/III trials happening NOW | BEST FIT |
| 2 | **KAIST Cell Reprogramming (Boolean Network Modeling)** | HIGH | Lab-only (in vitro) | STRONG FIT |
| 3 | **CAR-T Solid Tumors (Target Discovery + Design)** | MEDIUM-HIGH | Phase I/II | GOOD FIT |
| 4 | **Russia Autologous Vaccines** | MEDIUM | Early clinical trials | LIMITED FIT |

**Our recommendation: Start with Track 1 (mRNA neoantigen prediction) because:**
- The computational bottleneck is clearly defined and UNSOLVED
- Open-source tools and public data exist for us to build on immediately
- Better algorithms = directly better patient outcomes (measurable impact)
- Multiple clinical trials are running RIGHT NOW that need this exact work
- We can contribute without a wet lab

---

## Track 1: mRNA Cancer Vaccines -- THE COMPUTATIONAL GOLDMINE

### What's Happening (Updated Feb 2026)

**Moderna/Merck V940 (mRNA-4157, now called "intismeran autogene"):**
- 5-YEAR follow-up data released Jan 2026: **49% reduction in recurrence/death** in melanoma patients vs. Keytruda alone (HR 0.510)
- Phase III trial (INTerpath-001) for melanoma is **FULLY ENROLLED**
- Phase III for non-small cell lung cancer (NSCLC) is **NOW ENROLLING**
- This is the most advanced mRNA cancer vaccine in the world

**BioNTech/Roche autogene cevumeran:**
- 3-year Phase I follow-up for pancreatic cancer: immune responses persisting 3+ years in responders
- BUT: Failed in first-line melanoma, and Phase II bladder cancer trial put on hold due to safety event
- Phase II pancreatic cancer trial (260 patients) is underway
- Colorectal cancer data expected late 2025/early 2026

**Russia (Gamaleya Center):**
- "Enteromix" mRNA cancer vaccine declared ready for clinical use (Sep 2025)
- Melanoma vaccine: January 2026 data reported 90% efficacy in halting metastatic spread (NEEDS VERIFICATION -- this claim seems very aggressive)
- Using AI-driven algorithms for personalized mRNA blueprints

### THE COMPUTATIONAL BOTTLENECK: Neoantigen Prediction

Here's the pipeline that makes or breaks an mRNA cancer vaccine:

```
Patient's tumor biopsy
        |
        v
  DNA Sequencing (tumor + healthy tissue)
        |
        v
  Variant Calling (find mutations)     <-- Computational, but SOLVED
        |
        v
  HLA Typing (patient's immune profile) <-- Computational, mostly SOLVED
        |
        v
  Peptide-MHC Binding Prediction        <-- Computational, ~70-80% accuracy
        |                                    IMPROVABLE
        v
  Immunogenicity Prediction             <-- Computational, POORLY SOLVED
        |                                    THIS IS WHERE WE CAN HELP
        v
  Neoantigen Ranking & Selection (~20)  <-- Computational, needs work
        |
        v
  mRNA Sequence Design & Optimization   <-- Computational, active research
        |
        v
  Manufacturing (4-6 weeks per patient)
        |
        v
  Injection + checkpoint inhibitor
```

**The key unsolved problem**: Given a patient's tumor mutations and immune profile, predict which mutations will actually trigger a T-cell response if encoded in a vaccine.

Current tools achieve ~70-80% accuracy for binding prediction but much worse for actual immunogenicity. The BioNTech pancreatic trial showed only 50% of patients responded -- better neoantigen selection could increase that dramatically.

### Open Source Tools We Can Build On

| Tool | What It Does | Status |
|------|-------------|--------|
| **ImmunoNX** | End-to-end neoantigen prediction, used in 11 clinical trials, 185+ patients | Active, open-source (Dec 2025) |
| **OpenVax** | Dockerized pipeline: sequencing -> neoantigen prediction | Established |
| **pVACtools/pVACseq** | Neoantigen prioritization framework | Widely used |
| **NetMHCpan** | Peptide-MHC binding prediction | Gold standard |
| **MHCflurry** | Deep learning MHC binding prediction | Open-source, active |
| **DeepNeo** | Peptide-MHC binding + T-cell reactivity prediction | Available |
| **nextNEOpi** | Nextflow-based comprehensive pipeline | GitHub: icbi-lab/nextNEOpi |
| **Seq2Neo** | End-to-end including INDELs and gene fusions | Open-source |
| **NeoDisc** | Proteogenomic pipeline (Nature Biotech 2024) | Research-grade |

### Public Datasets

- **TCGA** (The Cancer Genome Atlas): 20,000+ tumor samples, 33 cancer types, fully sequenced
- **GEO** (Gene Expression Omnibus): Massive gene expression database
- **Human Protein Atlas**: Protein expression across tissues
- **IEDB** (Immune Epitope Database): Known immune-recognized peptides
- **TESLA Consortium data**: Benchmarking neoantigen prediction methods

### What We Could Build

1. **Improved immunogenicity predictor** using modern ML (transformers, graph NNs) trained on TESLA/IEDB data
2. **Patient response predictor** -- who will be a "responder" vs "non-responder" based on pre-treatment data
3. **mRNA sequence optimizer** -- given target neoantigens, design optimal mRNA sequence (codon optimization + secondary structure)
4. **Open-source end-to-end pipeline** that improves on existing tools with better ML components

---

## Track 2: KAIST Cancer Cell Reprogramming

### What's Happening (Updated Feb 2026)

Professor Kwang-Hyun Cho's lab has published a FLURRY of papers:

1. **"Control of Cellular Differentiation Trajectories for Cancer Reversion"** -- Advanced Science, Dec 2024 (DOI: 10.1002/advs.202402132)
   - Original colon cancer reprogramming paper
   - Used Boolean network digital twin to find master switches

2. **Molecular switch for cancer reversion** -- Advanced Science, Feb 2025 (DOI: 10.1002/advs.202412503)
   - Captured the "critical transition" moment when normal cells become cancerous
   - Introduced **BENEIN** (Boolean Network Inference and Control) -- their key computational tool

3. **Lung cancer immune evasion (DDX54)** -- PNAS, April 2025
   - Identified master regulator of immune evasion in lung cancer

4. **Generative deep learning for cell perturbation** -- Cell Systems, Oct 2025 (DOI: 10.1016/j.cels.2025.101405)
   - Applied image-generation AI concepts ("direction vectors") to cell state transformation
   - THIS IS THE MOST COMPUTATIONALLY INTERESTING PAPER

5. **Technology transferred to BioRevert Inc.** -- Cho is inventor, board member, equity owner
   - This means commercialization is being pursued

### The Computational Method (BENEIN)

For a software engineer, BENEIN is essentially:
- A **Boolean network inference engine** that builds a logical model of gene interactions from data
- Then performs **attractor analysis** (finding stable states in the network = cell types)
- Then solves a **control problem** (what minimal set of gene perturbations shifts from cancer attractor to normal attractor)
- Related to SAT solving, feedback vertex set problems, model checking

### Honest Assessment
- Scientifically solid and rapidly advancing (4+ major papers in 12 months)
- BUT: Still in vitro only (no animal models published, no human trials)
- The Oct 2025 Cell Systems paper on generative deep learning is a MAJOR upgrade -- they're moving beyond simple Boolean models
- **Realistic timeline to clinical impact: 5-15 years**

### Our Opportunity
- We could implement and extend BENEIN-style methods
- Apply modern ML (as Cho's Oct 2025 paper suggests) to scale beyond Boolean networks
- BUT: requires more biology domain knowledge than Track 1
- Lower near-term impact potential

---

## Track 3: CAR-T Solid Tumors

### What's Happening (Updated Feb 2026)

- 2025 ASCO Annual Meeting presented 12 Phase I studies for CAR-T in solid tumors
- Encouraging results in: brain, gastric, liver, sarcoma, neuroblastoma, CLDN6+ tumors
- New approach: **CAR-M (CAR Macrophage)** therapy emerging as alternative that may work better in solid tumor microenvironments
- Spain's Hospital Clinic Barcelona pioneered academic CAR-T manufacturing (ARI-0001, approved 2021) at ~$90K vs $350K+ commercial
- The "50%+ cure rate for solid tumors" claim from Welltica article appears overstated -- that figure likely refers to blood cancer (ALL/lymphoma) remission rates, not solid tumors

### Computational Opportunities
- CAR design optimization (protein engineering + ML)
- Antigen discovery from single-cell RNA-seq data
- Patient response prediction
- Agent-based simulation of T-cell behavior in tumor microenvironment (PhysiCell)

### Our Fit
- Less direct than neoantigen prediction
- Requires protein structure expertise (AlphaFold-adjacent)
- Fewer public datasets and benchmarks available

---

## Track 4: Russia -- Autologous Vaccines & Early Detection

### What's Happening (Updated Feb 2026)

- Gamaleya Center launched "Enteromix" personalized mRNA vaccine (Sep 2025)
- Using AI-driven algorithms for vaccine design (details proprietary)
- Melanoma vaccine reporting 90% efficacy (Jan 2026) -- EXTRAORDINARY claim that needs independent verification
- Petrov Center continues autologous vaccine research
- Vietnam partnership for technology transfer in progress

### Honest Assessment
- Russian research is harder to verify due to limited English-language peer-reviewed publications
- Some claims (90% efficacy) are exceptionally aggressive and should be treated with caution
- Less open-source tooling and public data available
- The computational approaches (AI-driven vaccine design) are likely similar to what BioNTech/Moderna are doing, but less transparent

### Our Fit
- Limited. We can't easily build on proprietary Russian pipelines
- If their results are real, the approaches overlap with Track 1 anyway

---

## RECOMMENDED FIRST PROJECT

### Build an Improved Neoantigen Immunogenicity Predictor

**Why this:**
- Clear, well-defined problem with measurable accuracy
- Open datasets (IEDB, TESLA) and open-source baselines (MHCflurry, DeepNeo)
- Directly applicable to ongoing Phase II/III clinical trials
- Can be done entirely computationally (no wet lab needed)
- If we build something better, researchers worldwide can use it immediately

**Tech stack:**
- Python + PyTorch
- BioPython for sequence manipulation
- Existing tools as baselines (MHCflurry, NetMHCpan)
- TCGA/IEDB for training data
- Potentially: protein language models (ESM-2) for feature extraction

**First milestone:**
- Set up the bioinformatics environment
- Download and explore IEDB and TESLA benchmark datasets
- Reproduce baseline results from existing tools
- Identify where current approaches fail

**Success metric:**
- Beat state-of-the-art immunogenicity prediction accuracy on TESLA benchmark

---

## Sources

- [KAIST News - Cancer Reversion](https://news.kaist.ac.kr/newsen/html/news/?mode=V&mng_no=42710)
- [KAIST Molecular Switch Paper](https://phys.org/news/2025-02-molecular-reverses-cancerous-critical-moment.html)
- [KAIST Generative DL in Cell Systems](https://news.kaist.ac.kr/newsen/html/news/?skey=prof&sval=Kwang-Hyun+Cho)
- [Moderna/Merck 5-Year Data](https://www.merck.com/news/moderna-merck-announce-5-year-data-for-intismeran-autogene-in-combination-with-keytruda-pembrolizumab-demonstrated-sustained-improvement-in-the-primary-endpoint-of-recurrence-free-survival-i/)
- [Moderna/Merck 49% Risk Reduction](https://www.fiercebiotech.com/biotech/merck-moderna-cancer-vaccine-sustains-49-melanoma-risk-reduction-5-years)
- [BioNTech 3-Year Pancreatic Data](https://investors.biontech.de/news-releases/news-release-details/three-year-phase-1-follow-data-mrna-based-individualized)
- [BioNTech Neoantigen Shot Challenges](https://www.oncologypipeline.com/apexonco/more-problems-biontech-roches-neoantigen-shot)
- [NCI Neoantigen Vaccine Report](https://www.cancer.gov/news-events/cancer-currents-blog/2025/neoantigen-vaccine-pancreatic-kidney-cancer)
- [CAR-T Solid Tumors ASCO 2025](https://jhoonline.biomedcentral.com/articles/10.1186/s13045-025-01760-9)
- [Russia Enteromix Vaccine](https://bisresearch.com/news/russia-unveils-enteromix-worlds-first-personalized-mrna-cancer-vaccine-awaits-final-approval)
- [Russia mRNA Vaccine Launch](https://www.newsweek.com/russia-launch-free-cancer-vaccine-2025-2001432)
- [ImmunoNX Pipeline](https://arxiv.org/abs/2512.08226)
- [OpenVax Pipeline](https://pubmed.ncbi.nlm.nih.gov/32124317/)
- [NeoDisc (Nature Biotech)](https://www.nature.com/articles/s41587-024-02420-y)
- [nextNEOpi GitHub](https://github.com/icbi-lab/nextNEOpi)
