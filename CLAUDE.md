# Cancer Treatment Research Project

## Mission

Advance the cure for cancer by synthesizing recent global breakthroughs, identifying actionable research directions, and building computational tools to accelerate progress. We operate with delusional optimism grounded in scientific rigor -- it IS possible, we just need to figure out how.

---

## Team Roles

### Claude (AI Co-Researcher -- Biology & Computation)

- **Primary role**: PhD-level biology co-author. Responsible for understanding, explaining, and reasoning about cancer biology, immunology, genetics, and treatment mechanisms.
- **Responsible for**: Literature review, biological reasoning, experimental design suggestions, data analysis strategy, computational biology pipelines, and translating complex biology into plain language.
- **Critical rule**: NEVER guess on biology. If uncertain about a claim, flag it clearly and suggest who to contact (specific researchers, labs, or institutions) to verify. Lives are at stake.
- **Secondary role**: Writing code for simulations, data analysis, bioinformatics pipelines, and visualization tools.

### Ertem (Software Engineer & Project Lead)

- **Primary role**: High-level SWE providing infrastructure, code execution, resource acquisition, and human networking.
- **Responsible for**: Running code, managing compute resources, connecting with researchers and institutions, funding/resource acquisition, and project management.
- **Biology level**: Beginner -- all biology terms must be explained in plain language when first introduced.

---

## Key Biology Terms (Plain Language Glossary)

Terms are explained as they come up. This is a living glossary.

### The Immune System Basics

- **Immune system**: Your body's defense army. It detects and destroys things that shouldn't be there -- viruses, bacteria, and (ideally) cancer cells.
- **T-cells**: A type of white blood cell that acts like a soldier. They patrol your body looking for infected or abnormal cells to kill. "T" comes from the thymus, the organ where they mature.
- **Antigens**: Name tags on the surface of cells. Every cell has them. Your immune system reads these tags to decide "friend or foe." Cancer cells sometimes rip off their name tags or wear fake ones to hide.

### Cancer Basics

- **Tumor**: A lump of cells that are multiplying out of control. Can be benign (harmless) or malignant (dangerous, spreading).
- **Metastasis**: When cancer cells break away from the original tumor and travel through the blood or lymph system to start new tumors elsewhere. This is what makes cancer deadly -- not the original tumor itself, but the spread.
- **Oncology**: The branch of medicine that deals with cancer. An oncologist is a cancer doctor.
- **Differentiation**: The process where a generic cell becomes a specialized cell (like a skin cell, liver cell, etc.). Cancer cells are often "de-differentiated" -- they've lost their specialization and reverted to a more primitive, rapidly-dividing state.
- **Re-differentiation**: Forcing a cancer cell to become a normal, specialized cell again. This is what South Korea's KAIST breakthrough does -- instead of killing the cancer cell, they reset it back to normal.

### Treatment Approaches

- **Chemotherapy ("chemo")**: Drugs that kill rapidly dividing cells. The problem: it kills ALL rapidly dividing cells, including healthy ones (hair, gut lining, immune cells). That's why patients lose hair and feel terrible.
- **Radiation therapy**: Using high-energy beams to damage the DNA of cancer cells so they can't reproduce. Also damages nearby healthy tissue.
- **Immunotherapy**: Treatments that help your own immune system fight cancer better, rather than using external poisons. This is the paradigm shift happening right now.
- **CAR-T cell therapy**: (Chimeric Antigen Receptor T-cell therapy) -- Taking a patient's own T-cells out of their body, genetically engineering them in a lab to have a special receptor (like giving a soldier a heat-seeking missile), then putting them back in. The modified T-cells can now find and kill cancer cells that were previously hiding. Spain is achieving 50%+ remission with this.
- **Autologous cancer vaccines**: "Autologous" = from the patient themselves. A vaccine made from the patient's own tumor material that trains their immune system to recognize and attack their specific cancer. Russia's Petrov Oncology Center is pioneering this.
- **Radiopharmaceuticals**: Radioactive drugs that are designed to accumulate specifically in tumor cells and destroy them from the inside. Like a guided missile vs. carpet bombing. Russia's Tsyb Center uses these.
- **Precision oncology**: Studying the specific genetic mutations and molecular characteristics of an individual patient's tumor to design a treatment tailored just for them. No two cancers are identical.
- **Digital twin technology**: Creating a computer simulation of a patient's cancer cells to test thousands of treatment approaches virtually before trying anything on the actual patient. South Korea's KAIST uses this.
- **mRNA vaccines for cancer**: The same technology used for COVID-19 vaccines, adapted to teach the immune system to recognize cancer-specific proteins. Trials ongoing across Europe (UK, Germany, Belgium, Spain, Sweden), expected completion by 2027.

---

## Global Breakthroughs We Are Tracking

### 1. Russia -- Autologous Cancer Vaccines & Early Detection
- **Who**: Petrov Oncology Center, St. Petersburg; Tsyb Medical Radiological Research Center
- **What**: Personalized vaccines from patient's own tumor + blood test detecting cancer from a single drop (looking for vesicles -- tiny bubbles shed by cells that carry molecular info about the cell they came from)
- **Also**: Radiopharmaceuticals for inoperable tumors
- **Partnership**: Vietnam's Tam Anh Hospital (technology transfer, Sep 2025)
- **Sources**: [Linical](https://www.linical.com/articles-research/world-cancer-day-2026), [Tuoi Tre News](https://news.tuoitre.vn/vietnams-tam-anh-hospital-partners-with-russias-top-cancer-research-center-to-advance-diagnosis-treatment-103250915121229693.htm)

### 2. South Korea -- Cancer Cell Reprogramming
- **Who**: KAIST (Korea Advanced Institute of Science and Technology)
- **What**: Reprogramming cancer cells back into normal healthy cells using digital twin technology and simulation analysis. No chemo, no radiation. Currently works on colon cancer.
- **Key concept**: Cancer cell re-differentiation -- resetting malignant cells instead of destroying them
- **Source**: [Medstown](https://www.medstown.com/cancer-cured-without-chemo-south-korean-breakthrough-reprograms-cancer-cells/)

### 3. Spain -- CAR-T Cell Therapy Expansion
- **Who**: Spanish research hospitals (expanding to Germany)
- **What**: Over 50% remission rates with CAR-T therapy. Expanding from blood cancers to solid tumors: breast, brain, lung.
- **Key challenge**: CAR-T has historically worked best on blood cancers (leukemia, lymphoma). Making it work on solid tumors is one of the biggest open problems in oncology.
- **Source**: [Welltica](https://welltica.com/spanish-doctors-in-shock-new-cancer-treatment-cures-over-50-of-patients/)

### 4. Europe-wide -- mRNA Cancer Vaccines
- **Who**: Multiple countries (UK, Germany, Belgium, Spain, Sweden)
- **What**: Adapting COVID-19 mRNA vaccine tech for personalized cancer vaccines
- **Timeline**: Trials expected to complete by 2027
- **Source**: [World Economic Forum](https://www.weforum.org/stories/2025/02/cancer-treatment-and-diagnosis-breakthroughs/)

---

## The Common Thread (Our North Star)

All breakthroughs share one principle: **make the body fight cancer using its own biology**.

1. **Immune activation** -- Train or engineer immune cells to recognize cancer
2. **Cellular-level precision** -- Target only cancer cells, spare everything else
3. **Personalized medicine** -- Every patient's cancer is unique, treatment should be too
4. **Non-toxic** -- Work WITH natural cellular processes, not against them

The era of "poison everything and hope the cancer dies first" is ending. The future is precision, personalization, and immunology.

---

## Project Structure

```
cancer-treatment-research/
├── CLAUDE.md                  # This file -- project context and instructions
├── README.md                  # Public-facing project description
├── research/                  # Literature reviews, paper summaries, notes
├── updates/                   # Daily progress reports (YYYY-MM-DD.md)
├── data/                      # Datasets, genomic data, clinical trial data
├── tools/                     # Bioinformatics tools and utilities
├── docs/                      # Documentation, designs, correspondence drafts
├── ralph/                     # Autonomous research loop (Ralph loop)
│   ├── run.sh                 # Loop runner script
│   ├── PROMPT.md              # Research PRD for autonomous iterations
│   └── progress.md            # State serialization between iterations
└── .claude/commands/          # Claude Code skills
    └── daily-update.md        # Daily progress update generator
```

## Autonomous Research (Ralph Loop)

Claude runs autonomously via a Ralph loop -- a bash loop that repeatedly invokes Claude Code with clean context. Each iteration:
1. Reads the PRD (`ralph/PROMPT.md`) and accumulated progress (`ralph/progress.md`)
2. Picks the next incomplete task
3. Does the work, commits results
4. Serializes learnings to progress.md for the next iteration

Run with: `./ralph/run.sh [iterations]`

## RL-Guided Model Search

We use structured exploratory search (inspired by [Stanford CRFM fast kernels](https://crfm.stanford.edu/2025/05/28/fast-kernels.html)) to systematically improve our immunogenicity predictor. See `docs/rl-environment-design.md` for the full design.

---

## Working Principles

1. **Rigor over speed** -- Every biological claim must be verifiable. If Claude is not 95%+ confident, it gets flagged.
2. **Plain language first** -- Every concept gets explained simply before using jargon.
3. **Open science** -- Everything we build should be shareable and reproducible.
4. **Build on giants** -- We don't reinvent; we synthesize, connect, and extend existing work.
5. **Computational leverage** -- We are a SWE + AI team. Our superpower is computation, simulation, and data analysis at scale. We use this to accelerate what wet labs do slowly.
6. **Contact real experts** -- When we hit the limits of what we can verify computationally, we identify and reach out to specific researchers. Ertem handles the human networking.

---

## Our 6 Shots on Goal

After broad research across all major fronts in computational oncology (Feb 2026), we identified **6 independent problem areas** where our SWE + AI skills can make real contributions without a wet lab. Full analysis in `research/04-shots-on-goal.md`.

### Shot 1 (P0): Neoantigen Immunogenicity Prediction -- PRIMARY FOCUS

**The problem**: Given a cancer patient's tumor mutations and immune profile (HLA type), predict which mutated proteins will actually trigger a T-cell immune response when encoded in an mRNA vaccine. Current best: NeoTImmuML at AUC 0.8865, but still not good enough (BioNTech pancreatic trial had only 50% responders).

**Key gap**: No tool integrates ALL signals (MHC binding + TCR recognition + clonality + expression + proteasomal processing + structure). We can use Boltz-2 for structural features -- largely missing from current tools.

**Tools**: NeoTImmuML, MHCflurry, NetMHCpan, OpenVax, pVACtools, Boltz-2, DeepNeo
**Data**: IEDB, TESLA Consortium, TCGA, TumorAgDB2.0, Human Protein Atlas

### Shot 2 (P1): Drug Combination Prediction

**The problem**: Find which drug pairs work synergistically against specific cancers. NIH/MIT achieved 83% hit rate for pancreatic cancer using graph convolutional networks. Pipeline is fully open-source.

**Tools**: PANC1 (github.com/ncats/PANC1), SynerGNet, GraphSynergy
**Data**: DrugComb (740K experiments), NCI-ALMANAC

### Shot 3 (P2): Cancer Cell Reprogramming

**The problem**: Computationally identify how to reprogram cancer cells back to normal. KAIST's BENEIN (Boolean networks) and UCSD's CANDiT (genome-wide ML, Cell Reports Medicine Oct 2025) both demonstrated this works.

**Tools**: BENEIN, CANDiT, scGPT/CellFM (single-cell foundation models)
**Data**: TCGA, Human Cell Atlas (scRNA-seq)

### Shot 4 (P2): Liquid Biopsy ML (Early Cancer Detection)

**The problem**: Detect cancer from blood tests using ML on cell-free DNA/RNA fragmentation patterns. Stage I detection is the hardest unsolved problem (17-80% sensitivity depending on approach).

**Tools**: FinaleToolkit, DELFI (github.com/cancer-genomics/delfi_scripts)
**Data**: FinaleDB, TCGA cfDNA data

### Shot 5 (P3): Digital Pathology AI

**The problem**: Fine-tune open-source pathology foundation models (UNI 2.0, CONCH) for specific cancer questions. 30K TCGA slides are free. Engineering bottleneck, not biology bottleneck.

**Tools**: UNI 2.0 (github.com/mahmoodlab/UNI), CONCH, MedSAM2
**Data**: TCGA pathology slides (~30K), CAMELYON, PANDA Challenge

### Shot 6 (P3): AI Antibody Design

**The problem**: Design therapeutic antibodies targeting cancer markers. RFantibody (Baker Lab, Nature Nov 2025) designs from scratch with atomic accuracy. Could target neoantigens we identify in Shot 1.

**Tools**: RFantibody (github.com/RosettaCommons/RFantibody), Boltz-2/BoltzGen
**Data**: PDB, antibody structure databases

### Cross-Cutting Synergies

The shots reinforce each other: drug combos that enhance vaccine response (2→1), reprogramming + vaccination dual strategy (3→1), pathology AI predicting vaccine responders (5→1), liquid biopsy monitoring vaccine response (4→1), Boltz-2 structural features for neoantigen prediction (6→1).

---

## Research Documents

| File | Contents |
|------|----------|
| `research/00-synthesis-and-computational-leverage.md` | Original 4-track analysis |
| `research/01-ai-drug-discovery-and-foundation-models.md` | AI/ML tools landscape, foundation models, drug discovery |
| `research/02-early-detection-imaging-multiomics.md` | Liquid biopsy, digital pathology, radiomics, multi-omics |
| `research/03-immunotherapy-reprogramming-synbio.md` | CAR-T, reprogramming, synthetic biology, antibody design |
| `research/04-shots-on-goal.md` | **THE KEY FILE** -- 6 prioritized problems with tools, data, effort estimates |
| `research/european-mrna-cancer-vaccine-trials.txt` | European mRNA vaccine trials detail |

---

## Next Steps

- [x] Deep-dive into each breakthrough: read actual papers
- [x] Identify which approach has the highest computational leverage
- [x] Map the research landscape: who is doing what, where are the gaps
- [x] Broaden scope: identify multiple "shots on goal" across different fields
- [ ] Set up bioinformatics toolchain (Python, BioPython, PyTorch, genomic tools)
- [ ] Download and explore IEDB and TESLA benchmark datasets
- [ ] Reproduce baseline results from existing neoantigen prediction tools (NeoTImmuML)
- [ ] Reproduce PANC1 drug combination pipeline on pancreatic cancer
- [ ] Identify where current approaches fail (error analysis)
- [ ] Design improved immunogenicity predictor (integrate structural features via Boltz-2)
- [ ] Draft outreach list: researchers we may want to contact

---

## Integrity Notice

This project aims to contribute to cancer research through computational methods and synthesis. We are not medical professionals. Any findings or tools produced here should be shared with qualified researchers and clinicians for validation before any clinical application. We move fast but we do not cut corners on accuracy.
