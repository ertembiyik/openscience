# How the Best AI Teams Advance Science -- Lessons for Our Cancer Research Pipeline

> **Date**: Feb 2026
> **Purpose**: Study how OpenAI, DeepMind, Meta, NVIDIA, and top biotech startups use AI for scientific discovery, and extract pipeline patterns we can reuse for our neoantigen immunogenicity prediction work (Shot 1) and broader cancer research.

---

## TL;DR -- The 7 Patterns That Matter Most for Us

1. **Evaluation harness first** -- Every winning team builds the benchmark before the model. Our TESLA benchmark harness is the single most important piece of infrastructure.
2. **LoRA fine-tuning of protein language models** -- ESM-2 (650M) + LoRA (rank >= 4) gives near-full-fine-tuning quality on a single GPU. This is our base architecture.
3. **Modular late fusion** -- Train separate predictors for each signal (binding, structure, expression, clonality), combine scores. Upgrade to cross-attention later.
4. **Structured search with LLM reasoning** -- Not random search. The LLM reads prior results, analyzes WHY things failed, proposes targeted next ideas. This is what our Ralph loop + RL environment enables.
5. **Critic function** -- Every iteration should validate claims from the previous one before building on them. Biology errors compound.
6. **Sequential transfer learning** -- Pre-train on binding (large dataset) -> eluted ligands -> stability -> immunogenicity (small dataset). Warm up with easy tasks.
7. **Validation-ready outputs** -- Format predictions so wet-lab collaborators can immediately test them (peptide, HLA, binding score, structural confidence, suggested assay).

---

## Part 1: OpenAI's Science Push

### The Big Picture

OpenAI created a dedicated **"OpenAI for Science"** division in Sep 2025, led by Kevin Weil (ex-Twitter/Instagram product lead, trained in particle physics at Stanford). Their thesis: **"2026 will be for science what 2025 was for software engineering."**

### Model Performance on Science Benchmarks

| Model | GPQA Diamond (PhD-level science) | Note |
|-------|----------------------------------|------|
| GPT-4 (2023) | 39% | |
| o1 (2024) | 78% | |
| o3 (Apr 2025) | 83-88% | |
| GPT-5.2 Pro (Dec 2025) | **93.2%** | |
| Human PhD experts | 69.7% | Models now beat experts |

But on the **FrontierScience Research track** (messy, multi-step research problems), even GPT-5.2 only hits **25%**. This is the calibration point: LLMs are excellent at individual reasoning steps but struggle with open-ended, multi-step research. Use them as accelerators for specific subtasks, not for end-to-end autonomous research.

### The T-Cell Case Study (Directly Relevant to Our Work)

OpenAI published a landmark paper (Nov 2025) with researchers at The Jackson Laboratory, Vanderbilt, Oxford, Cambridge, and others. The case study most relevant to us:

**Problem**: Dr. Derya Unutmaz's lab spent months trying to explain a puzzling change in human CD4+ T cells after brief treatment with 2-deoxyglucose (2DG, a metabolic inhibitor -- a molecule that blocks a cell's ability to process sugar for energy). After removing 2DG and priming with IL-2 (a signaling molecule that activates immune cells), the T cells shifted toward a proinflammatory Th17-like state (a type of T cell associated with autoimmune responses and some anti-tumor activity).

**GPT-5's contribution**: Analyzed unpublished flow cytometry data, identified the likely mechanism within minutes (interference with N-linked glycosylation -- the process of attaching sugar molecules to proteins -- affecting IL-2 signaling), identified the acting T-cell subpopulation, and suggested follow-up experiments. The lab tested these suggestions and **confirmed the hypothesis**.

**Why this matters for us**: Understanding how to keep engineered T cells active and functional (rather than exhausted or misdirected) is critical for CAR-T therapy and neoantigen vaccine design. The model's ability to reason about T-cell differentiation states from experimental data is exactly the capability we need.

### The 79x Wet Lab Breakthrough

OpenAI partnered with Red Queen Bio to test GPT-5 on real molecular biology protocols. The AI **autonomously designed improvements to a molecular cloning protocol** through iterative refinement (AI suggests change -> human runs protocol -> results fed back -> AI proposes next change). Result: **79x improvement in cloning efficiency** through a genuinely novel enzyme combination (RecA recombinase + T4 gp32 protein) that no human had tried.

**Key insight**: The novel combination wasn't in any paper. The model synthesized knowledge across enzyme families to propose something genuinely new. This suggests LLMs can generate novel biological hypotheses, not just retrieve known information.

### Moderna Partnership (mRNA Cancer Vaccines)

Moderna uses OpenAI models extensively (80%+ adoption internally, 750+ custom GPTs). Their **Dose ID GPT** automates analysis of clinical data for optimal vaccine dose selection. Moderna is bringing up to 15 new products to market in 5 years, **including individualized cancer treatments (mRNA cancer vaccines)** -- directly relevant to our tracking of European mRNA vaccine trials.

### Prism: Scientific Writing Workspace

Launched Jan 2026. Free, LaTeX-native workspace powered by GPT-5.2. Features: in-editor drafting, whiteboard-to-LaTeX conversion, arXiv search with auto-citation. Worth using when we write up findings.

### Deep Research

Launched Feb 2025, powered by o3. Produces cited multi-page reports from hundreds of sources. Useful for literature reviews but has important limitations:
- Prone to SEO-optimized content over primary research
- Occasionally cites non-existent papers
- Cannot process plots/diagrams
- Nature called it "an information engine, not an insight engine"

**Lesson**: Use Deep Research for breadth (finding papers we might miss), but always verify citations and do depth analysis ourselves.

---

## Part 2: How Other Companies Use AI for Medical/Science Discovery

### Google DeepMind / Isomorphic Labs -- Structure-First Pipeline

**AlphaFold 3** (open-sourced Nov 2024): Predicts 3D structure of complexes involving proteins, DNA, RNA, ligands, ions -- all in one model. 50%+ improvement over prior methods for protein-ligand interactions. Uses diffusion-based architecture. Weights available for academic use only (not commercial).

**AlphaMissense**: Predicted pathogenicity of all ~71 million possible single amino acid mutations in the human proteome. 89% classified as likely pathogenic or benign. Predictions available CC-BY.

**Isomorphic Labs** (drug discovery spinoff): Partnerships worth ~$3B (Eli Lilly $1.7B, Novartis $1.2B, J&J). First Phase I trials projected late 2026.

**Relevance for us**: AlphaMissense pathogenicity scores for all human missense variants could be a useful feature in our immunogenicity predictor -- mutations that are more pathogenic may correlate with stronger immune responses.

### Microsoft Research -- Dynamics, Not Just Structure

**BioEmu-1** (Feb 2025): Generates structural *ensembles* -- thousands of conformations a protein can adopt -- rather than single structures. This reveals transient binding pockets. **10,000-100,000x more efficient** than molecular dynamics simulations. Open-source on GitHub.

**Key insight**: Static structure prediction (AlphaFold-style) misses dynamic conformational changes. For peptide-MHC binding, the flexibility of both the peptide and the MHC groove matters. BioEmu could give us dynamic features that Boltz-2's static predictions miss.

### Meta AI / EvolutionaryScale -- Protein Language Models

**ESM-2/ESMFold** (2022): 15B parameter protein language model. Structure prediction emerges from language modeling alone -- no explicit structure training. Fully open-source (MIT license). Does NOT require multiple sequence alignments at inference (much faster than AlphaFold).

**ESM-3** (Jan 2025, published in Science): 98B params. First model to jointly reason over protein sequence, structure, AND function. Generated a novel fluorescent protein equivalent to ~500 million years of evolution. Open weights for academic use.

**Why ESM matters for us**: ESM-2 embeddings capture evolutionary and structural information about protein sequences. For neoantigen prediction, ESM-2 features of the mutant peptide + MHC allele could be our strongest single feature type. The PNAS paper on LoRA for protein language models specifically recommends rank >= 4, applied to key/value matrices of self-attention layers.

### NVIDIA -- Infrastructure for Everyone

**BioNeMo Framework** (open-source): Modular framework for training biological AI models at scale. Built-in 5D parallelism. Includes Evo2 (genomic AI), DiffDock (molecular docking), and others. If we need to scale training, this is the infrastructure.

**$1B Lilly Partnership**: Building a "continuous learning system" connecting agentic wet labs with computational dry labs. 24/7 AI-assisted experimentation.

### Insilico Medicine -- The Speed Leader (Most Relevant Startup)

First fully AI-designed drug in Phase II clinical trials (Rentosertib for pulmonary fibrosis). Target discovery to Phase I in **18 months** (vs. industry standard 48 months).

**Pipeline architecture (Pharma.AI)**:
1. **PandaOmics**: Target identification using deep feature selection + knowledge graph + LLMs on multi-omics data
2. **Chemistry42**: Molecule design using **40+ generative models running in parallel** with **multi-agent reinforcement learning** for scoring
3. **InClinico**: Clinical trial outcome prediction

**Key architectural decision**: Chemistry42 uses multi-agent RL where multiple generative models compete/collaborate, with molecules scored by multiple reward functions simultaneously. This is directly analogous to our RL-guided model search -- multiple model variants evaluated against multiple metrics.

### Recursion Pharmaceuticals -- Data-First

**65 petabytes** of proprietary biological data. Core method: Cell Painting assay (image healthy vs. diseased vs. treated cells, let AI find patterns humans can't see). Built BioHive-2 supercomputer (54th most powerful globally).

**Lesson**: Their data moat is their advantage. For us, the key insight is that **data quality beats model sophistication**. Cleaning and curating our training data (IEDB, TESLA, TCGA) should get as much attention as model architecture.

### Absci -- The Antibody Speed Loop

Tests ~3 million antibody designs per week. Goes from AI-designed antibodies to wet-lab-validated candidates in **6 weeks**. First AI-designed antibody in human trials (Dec 2025).

**Architecture**: epitope-conditioned structure generation -> paired CDR sequence design -> co-folding-based scoring.

### Baker Lab (University of Washington) -- Open Lab Gold Standard

David Baker won 2024 Nobel Prize. **All tools MIT-licensed** (free for academic AND commercial use):
- **RFdiffusion**: De novo protein structure design from scratch
- **RFantibody**: Antibody design with therapeutic-grade binding affinity
- **ProteinMPNN**: Sequence design for given structures
- **Boltz-2**: Structure prediction + binding affinity (MIT, from related MIT/Recursion team)

**What made them the gold standard**: Radical openness (MIT license), in-house wet lab validation for every computational prediction, and an ecosystem where tools feed each other (RFdiffusion -> ProteinMPNN -> RoseTTAFold -> Boltz).

**Why Baker Lab matters for us**: Boltz-2 is already in our Shot 1 plan. RFantibody connects to Shot 6 (antibody design). The MIT licensing means we can build on these tools without restrictions.

---

## Part 3: Pipeline Patterns We Should Adopt

### Pattern 1: The "Structured Discovery Loop" (Stanford CRFM + AI Scientist)

The most successful AI-for-science systems all implement the same core loop:

```
REASON (read prior results, analyze failures, propose ideas)
    |
GENERATE (spawn N variants in parallel)
    |
EVALUATE (benchmark harness, per-dimension breakdown)
    |
CRITIQUE (validate claims, check for leakage, sanity check)
    |
SELECT (top-K, record results)
    |
    └──> back to REASON
```

This is what our Ralph loop + RL environment already implements. The key additions based on industry lessons:

1. **Natural language failure analysis** between rounds (Stanford CRFM pattern). Don't just report AUC. Have the LLM analyze WHY specific predictions fail and hypothesize what would fix them. Most breakthroughs in the Stanford work emerged in rounds 4-5, not round 1.

2. **Critic phase** (BioLab multi-agent pattern). Each iteration starts by critically examining claims from the previous iteration. In biology, a "97% AUC" could easily be data leakage.

3. **Tree search, not linear search** (AI Scientist v2 pattern). Each idea spawns multiple implementations. Prune bad branches early, deepen promising ones.

### Pattern 2: LoRA Fine-Tuning of Foundation Models (PNAS, ImmugenX)

The recipe is becoming clear and it's feasible on a single GPU:

1. **Start with ESM-2 (650M)** as the protein language model backbone
2. **Domain-specific continued pre-training** on pMHC data (ESMCBA showed this significantly helps)
3. **LoRA fine-tuning** (rank >= 4, on key/value attention matrices) for the downstream task
4. **QLoRA** enables this on consumer GPUs with 24GB VRAM (RTX 4090)
5. **Memory reduction**: Up to 90% less VRAM vs. full fine-tuning

### Pattern 3: Modular Architecture with Late Fusion (ImmugenX)

The winning architecture for immunogenicity prediction is modular:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Binding    │ │  Structure  │ │ Expression  │ │  Clonality  │
│  Predictor   │ │  Predictor  │ │  Predictor  │ │  Predictor  │
│ (MHCflurry + │ │  (Boltz-2)  │ │   (TCGA)    │ │  (VAF/CCF)  │
│  ESM-2/LoRA) │ │             │ │             │ │             │
└──────┬───────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │                │               │               │
       └────────────────┴───────┬───────┴───────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   FUSION LAYER       │
                    │ (Start: weighted sum) │
                    │ (Later: cross-attn)  │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  IMMUNOGENICITY      │
                    │  PREDICTION          │
                    └──────────────────────┘
```

**Why modular**: Each module can be developed and tested independently. New data sources (proteasomal processing, TAP transport) can be added without retraining everything. Late fusion (weighted sum of scores) is simple and works well enough for a baseline; cross-attention can be added later for the interaction effects.

### Pattern 4: Sequential Transfer Learning (ImmugenX)

Train on progressively harder tasks, each time starting from the previous checkpoint:

```
Large, noisy data                              Small, precious data
     |                                              |
     v                                              v
[Binding Affinity] -> [Eluted Ligands] -> [pMHC Stability] -> [Immunogenicity]
   99K samples          ~50K samples       ~10K samples        ~2K samples
```

Each stage provides a warm start for the next. The binding affinity stage teaches the model what MHC-peptide interaction looks like; the immunogenicity stage (final) fine-tunes for what actually triggers T-cell response.

### Pattern 5: Validation-Ready Outputs (Twist Bioscience Principle)

Structure predictions for immediate wet-lab testing:

```json
{
  "peptide": "KRAS_G12V_VVGAVGVGK",
  "hla_allele": "HLA-A*02:01",
  "binding_affinity_nM": 45.2,
  "immunogenicity_score": 0.87,
  "structural_confidence": 0.92,
  "expression_tpm": 156.3,
  "clonal_fraction": 0.78,
  "suggested_validation": "ELISPOT with autologous PBMCs, tetramer staining",
  "clinical_relevance": "KRAS G12V present in ~30% of pancreatic cancers"
}
```

This makes our predictions immediately actionable when Ertem connects with wet-lab researchers.

---

## Part 4: What NOT to Do (Failure Modes from the Field)

### 1. Don't Trust AI for Novelty Assessment
AI Scientist v2 evaluation (ACM SIGIR) showed systematic failures: 42% of experiments failed from coding errors, and the system regularly misclassified established concepts as novel. Use AI for generation and evaluation, not for judging whether something is new.

### 2. Don't Conflate Binding with Immunogenicity
This is the #1 biological error in the field. A peptide that binds MHC well is NOT necessarily immunogenic (will NOT necessarily trigger T-cell response). Our error analysis should specifically track this confusion. BioNTech's pancreatic cancer trial had only 50% responders despite good binding predictions.

### 3. Don't Skip the Evaluation Harness
Build `tools/evaluate.py` FIRST. Make it deterministic. Never tune on the test set. Report per-allele breakdowns (aggregate AUC hides allele-specific failures). This is our fitness function -- everything depends on it.

### 4. Don't Scale Volume Without Quality
Multiple 2025 reports show diminishing returns from scaling data volume alone. Clean, well-annotated data from IEDB and TESLA matters more than scraping every database.

### 5. Don't Build End-to-End Before Proving Components
Prove each module individually (binding, structure, expression, clonality) before integration. Insilico, Absci, and Generate all built modular systems where each piece was validated independently.

---

## Part 5: Tools and Resources to Leverage

### Immediately Useful (Free, Open-Source)

| Tool | What It Does | License | Our Use Case |
|------|-------------|---------|-------------|
| **ESM-2** (Meta) | Protein embeddings from sequence | MIT | Feature extraction for peptides + MHC |
| **Boltz-2** (MIT/Recursion) | Structure prediction + binding affinity | MIT | Structural features for pMHC complexes |
| **MHCflurry** (OpenVax) | MHC binding prediction | Apache 2.0 | Binding module baseline |
| **NetMHCpan** (DTU) | MHC binding prediction | Academic free | Binding module comparison |
| **RFantibody** (Baker Lab) | Antibody design | MIT | Shot 6 |
| **BioNeMo** (NVIDIA) | Training infrastructure | Apache 2.0 | Scaling if needed |
| **AlphaMissense predictions** | Variant pathogenicity | CC-BY | Feature for immunogenicity |

### Data Sources

| Dataset | What | Size | Use |
|---------|------|------|-----|
| **IEDB** | Immune epitope data | 1M+ epitopes | Primary training data |
| **TESLA Consortium** | Validated neoantigens | ~600 peptides | Benchmark (our CASP equivalent) |
| **TCGA** | Cancer genomics | 11K patients | Expression, mutation data |
| **Human Protein Atlas** | Protein expression | Proteome-wide | Expression features |
| **DrugComb** | Drug synergy | 740K experiments | Shot 2 |

### Recently Published Tools to Evaluate

| Tool | Published | What | Relevance |
|------|-----------|------|-----------|
| **ImmugenX** | 2024 | Modular PLM for immunogenicity | Architecture template |
| **ESMCBA** | 2025 | Domain-specific ESM pre-training for pMHC | Pre-training recipe |
| **NeoPrecis** | Jan 2026 | Clonality-aware neoantigen selection | Feature integration |
| **BioLab** | Sep 2025 | Multi-agent biology system (219 tools) | Agent architecture |
| **BioEmu-1** | Feb 2025 | Protein dynamics ensembles | Dynamic structure features |

---

## Part 6: Recommended Implementation Roadmap

Based on everything above, here's the phased plan optimized for a 1 SWE + AI team:

### Phase 0: Evaluation Harness (Week 1)
- Build `tools/evaluate.py` with deterministic TESLA benchmark evaluation
- Implement per-allele breakdown reporting
- Set up `search/results.json` leaderboard
- **This is the foundation. Nothing else works without it.**

### Phase 1: Feature Zoo + Baselines (Weeks 2-3)
- Download and process IEDB + TESLA datasets
- Implement feature extractors: one-hot encoding, BLOSUM matrices, ESM-2 embeddings, Boltz-2 structural scores
- Reproduce NeoTImmuML baseline (AUC 0.8865)
- Record all baselines in results.json

### Phase 2: LoRA Fine-Tuned Predictor (Weeks 3-4)
- Fine-tune ESM-2 (650M) with LoRA on pMHC binding data
- Sequential transfer: binding -> eluted ligands -> immunogenicity
- Build modular architecture (separate modules per signal type)
- Late fusion baseline

### Phase 3: Structured Search (Weeks 4-6)
- Ralph loop drives 5 rounds of structured search
- Each round: LLM reasons about failures -> generates variants -> evaluates -> selects
- Tree branching: each idea spawns 3-5 implementations
- Track all results in leaderboard

### Phase 4: Integration + Validation-Ready Output (Weeks 6-8)
- Best model packaged with per-allele performance reports
- Error analysis identifying systematic failure modes
- Validation-ready output format for wet-lab collaborators
- Draft outreach materials for researchers

---

## Key Takeaways

1. **We're in the right place at the right time.** OpenAI created a whole division for AI-in-science. DeepMind, Meta, Microsoft, and NVIDIA are all betting billions on this. The tools are open-source and mature enough for a small team.

2. **Our RL-guided search architecture is validated by industry.** Stanford CRFM, Insilico's multi-agent RL, and the AI Scientist tree search all implement the same core pattern we designed.

3. **The gap we identified is real.** No tool integrates all signals (binding + structure + TCR + clonality + expression + processing). ImmugenX comes closest with its modular architecture, and we can build on their pattern.

4. **Foundation models + LoRA make this feasible on modest hardware.** ESM-2 + LoRA is our path to state-of-the-art features without needing a GPU cluster.

5. **Validation-ready outputs are our networking superpower.** When Ertem reaches out to researchers, having concrete, testable predictions (not just a model) will open doors.

---

## Sources

### OpenAI
- [OpenAI for Science (MIT Tech Review, Jan 2026)](https://www.technologyreview.com/2026/01/26/1131728/inside-openais-big-play-for-science/)
- [Accelerating science with GPT-5 (OpenAI, Nov 2025)](https://openai.com/index/accelerating-science-gpt-5/)
- [Full GPT-5 science paper (arXiv)](https://arxiv.org/abs/2511.16072)
- [FrontierScience benchmark (OpenAI, Dec 2025)](https://openai.com/index/frontierscience/)
- [GPT-5 wet lab biology (OpenAI, Dec 2025)](https://openai.com/index/accelerating-biological-research-in-the-wet-lab/)
- [Moderna + OpenAI partnership](https://openai.com/index/moderna/)
- [Prism scientific workspace (OpenAI, Jan 2026)](https://openai.com/index/introducing-prism/)
- [Deep Research (Nature evaluation)](https://www.nature.com/articles/d41586-025-00377-9)
- [Advancing science with GPT-5.2 (OpenAI)](https://openai.com/index/gpt-5-2-for-science-and-math/)

### Google DeepMind
- [AlphaFold 3 (GitHub)](https://github.com/google-deepmind/alphafold3)
- [AlphaMissense (GitHub)](https://github.com/google-deepmind/alphamissense)
- [Isomorphic Labs (CNBC)](https://www.cnbc.com/2025/04/09/inside-isomorphic-labs-google-deepminds-ai-life-sciences-spinoff.html)
- [Isomorphic Labs raises $600M (GEN)](https://www.genengnews.com/topics/artificial-intelligence/deepmind-spinout-isomorphic-labs-raises-600m-toward-ai-drug-design/)

### Microsoft
- [BioEmu-1 (GitHub)](https://github.com/microsoft/bioemu)
- [Microsoft Discovery Platform (Azure Blog)](https://azure.microsoft.com/en-us/blog/transforming-rd-with-agentic-ai-introducing-microsoft-discovery/)

### Meta / EvolutionaryScale
- [ESM-2 (GitHub)](https://github.com/facebookresearch/esm)
- [ESM3 in Science (EvolutionaryScale)](https://www.evolutionaryscale.ai/blog/esm3-release)
- [ESM3 paper (Science)](https://www.science.org/doi/10.1126/science.ads0018)

### NVIDIA
- [BioNeMo Framework (GitHub)](https://github.com/NVIDIA/bionemo-framework)
- [NVIDIA + Lilly $1B partnership](https://nvidianews.nvidia.com/news/nvidia-and-lilly-announce-co-innovation-lab-to-reinvent-drug-discovery-in-the-age-of-ai)

### Startups
- [Insilico Medicine Phase II results (Nature Medicine)](https://www.nature.com/articles/s41591-025-03743-2)
- [Absci first AI antibody in humans (Dec 2025)](https://investors.absci.com/news-releases/news-release-details/absci-announces-first-participants-dosed-phase-12a-headlinetm)
- [Recursion Platform](https://www.recursion.com/platform)
- [Generate Biomedicines Phase 1](https://generatebiomedicines.com/media-center/generatebiomedicines-to-present-phase-1-results)

### Baker Lab
- [RFdiffusion (GitHub, MIT License)](https://github.com/RosettaCommons/RFdiffusion)
- [RFantibody (GitHub, MIT License)](https://github.com/RosettaCommons/RFantibody)
- [RFantibody in Nature (Nov 2025)](https://www.ipd.uw.edu/2025/11/rfantibody-in-nature/)

### Pipeline Patterns
- [AI Scientist v2 (Sakana AI)](https://arxiv.org/abs/2504.08066)
- [AI Scientist evaluation (ACM SIGIR)](https://arxiv.org/abs/2502.14297)
- [BioLab multi-agent system (bioRxiv)](https://www.biorxiv.org/content/10.1101/2025.09.03.674085v1)
- [LoRA for protein language models (PNAS)](https://www.pnas.org/doi/10.1073/pnas.2405840121)
- [ImmugenX (PLOS Comp Bio)](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1012511)
- [ESMCBA domain-specific pre-training](https://arxiv.org/html/2507.13077v1)
- [NeoPrecis (Jan 2026)](https://pubmed.ncbi.nlm.nih.gov/41577704/)
- [Stanford CRFM fast kernels](https://crfm.stanford.edu/2025/05/28/fast-kernels.html)
- [AI's future hinges on the wet lab (Twist Bioscience)](https://www.twistbioscience.com/blog/perspectives/AI-wetlab-validation)
- [Multi-modal AI in precision medicine (Frontiers)](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2025.1743921/full)
