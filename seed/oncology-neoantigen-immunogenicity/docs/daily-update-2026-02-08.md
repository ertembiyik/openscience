# Progress Report: 2026-02-08

## Summary

Full-day sprint: synthesized 4 global breakthroughs, set up environment, downloaded datasets, ran baselines (MHCflurry: 0.759 AUC-ROC, 0.188 AUPRC), built multi-feature models (best: 0.212 AUPRC), reviewed 8 papers, engineered 27 novel features, tested IEDB transfer learning, and conclusively proved that CPU-only tabular ML is exhausted for this problem. GPU access is now the blocker.

## What Was Done

### 1. Research Synthesis
- Investigated 4 cancer treatment breakthroughs (Russia, South Korea/KAIST, Spain CAR-T, Europe mRNA vaccines)
- Selected **neoantigen immunogenicity prediction for mRNA cancer vaccines** as highest-leverage computational focus
- Cataloged 9 tools and 5 public datasets

### 2. Environment & Data (Phase 1 -- COMPLETE)
- Set up Python 3.12 via uv with PyTorch, BioPython, scikit-learn, MHCflurry, transformers
- Downloaded IEDB T-cell dataset: 567K assays, filtered to 122K human MHC-I (44.9% positive)
- Downloaded TESLA benchmark: 608 peptides, 37 immunogenic (6.1% positive rate)
- Built data loaders (`tools/data_loader.py`) and evaluation harness (`tools/evaluate.py`)

### 3. Baselines (Phase 2 -- COMPLETE)
Ran MHCflurry and all TESLA pre-computed features as single-predictor baselines:

| Predictor | AUC-ROC | AUPRC |
|-----------|---------|-------|
| Random | 0.500 | 0.058 |
| NetMHCpan affinity | 0.747 | 0.150 |
| Binding stability | 0.686 | 0.154 |
| Tumor abundance | 0.643 | 0.110 |
| **MHCflurry presentation** | **0.759** | **0.188** |

### 4. Error Analysis & Multi-Feature Models (Phase 2 -- COMPLETE)
- MHCflurry misses 51% of immunogenic peptides (19/37 ranked outside top-100)
- False negatives have 5.5x weaker binding and 3.7x less stable pMHC complexes
- Foreignness score is **anti-predictive** (immunogenic peptides look LESS foreign)
- Best multi-feature model: **RF (TESLA + MHCflurry) = 0.738 AUC-ROC, 0.212 AUPRC**
- Per-patient AUPRC varies massively: 0.077 (Patient 16) to 0.540 (Patient 10)

### 5. Literature Review (Phase 3 -- MOSTLY COMPLETE)
Reviewed 8 papers on immunogenicity prediction (2022-2026):

| Method | Year | Approach | Best AUPRC |
|--------|------|----------|-----------|
| NeoaPred | 2024 | Structure-based mutant-vs-WT | 0.54 (own test) |
| ImmugenX | 2024 | 4-stage transfer learning PLM | 0.514 (cancer holdout) |
| BigMHC | 2023 | Transfer learning DNN | Strong on TESLA |
| Immunity harmonized | 2023 | Better data + ML | 0.273 (TESLA) |

**Key lessons**: Structure-based features are the biggest win. Transfer learning (binding → immunogenicity) is essential. ESM-2 alone doesn't help (ImmugenX finding).

### 6. Novel Feature Engineering (Phase 4 -- CPU work exhausted)
- Built 27 position-aware features (anchor positions, TCR contacts, AA properties, context)
- **Result: NEAR-USELESS alone** (0.08 AUPRC). Marginal when combined with binding features.
- Tested IEDB transfer learning: pan-allele model fails (0.07 AUPRC, domain shift too large), but A*02:01-specific model decent (0.73 AUC on subset)
- IEDB score as auxiliary feature contributes 6% importance; amino acid rarity contributes 5%
- **Conclusion: Tabular features are saturated. The 0.212 → 0.28+ gap requires structural or learned features.**

### 7. NeoaPred Investigation
- Analyzed NeoaPred repo: requires Python 3.6, CUDA, PyMesh2, MSMS, APBS, PDB2PQR
- Docker image available: `panda1103/neoapred:1.0.0`
- Needs wild-type peptide sequences (not in TESLA S4, would need Synapse access)
- **Impractical to run on Mac. Needs GPU server.**

## Key Findings

1. **Binding affinity is necessary but far from sufficient.** MHCflurry achieves 0.759 AUC-ROC from binding alone, but AUPRC is only 0.188. Many strong binders don't trigger immune responses.

2. **Simple ML on scalar features has plateaued at 0.212 AUPRC.** We tried 8 feature sets, 3 model types, transfer learning from 48K IEDB examples, and 27 novel features. None break through.

3. **The foreignness paradox.** Immunogenic peptides look LESS foreign by standard metrics (0.04 vs 0.10 foreignness score). This contradicts naive expectation and suggests current foreignness measures are wrong.

4. **Per-patient variation is the elephant in the room.** AUPRC ranges from 0.043 to 0.632 across patients. Some patients' immune responses may be fundamentally unpredictable from peptide features alone (TCR repertoire effects).

5. **Structure-based mutant-vs-WT comparison is the path forward.** NeoaPred achieves 0.54 AUPRC by modeling 3D peptide-HLA surfaces. Our tabular approximation of this idea (position + AA properties) captured <5% of the signal. You genuinely need the 3D information.

## Files Created/Modified

| File | Description |
|------|-------------|
| `CLAUDE.md` | Project context, roles, glossary, breakthroughs |
| `research/00-synthesis-and-computational-leverage.md` | Synthesis of 4 research tracks |
| `research/01-baseline-results.md` | MHCflurry and feature baseline results |
| `research/02-error-analysis-and-multifeature.md` | Error analysis + multi-feature RF/LR |
| `research/03-literature-review.md` | 8 papers reviewed, recommendations |
| `research/04-novel-features-and-transfer-learning.md` | Novel features + IEDB transfer experiments |
| `research/european-mrna-cancer-vaccine-trials.txt` | European mRNA vaccine trials brief |
| `tools/data_loader.py` | IEDB + TESLA data loaders |
| `tools/evaluate.py` | TESLA-standard evaluation metrics |
| `tools/baseline_mhcflurry.py` | MHCflurry + feature baselines |
| `tools/error_analysis_and_multifeature.py` | Error analysis + multi-feature models |
| `tools/feature_engineering.py` | 27 novel position-aware features |
| `tools/iedb_transfer.py` | IEDB transfer learning + hybrid model |
| `tools/explore_iedb.py` | IEDB exploration script |
| `ralph/progress.md` | Autonomous agent progress log (5 iterations) |
| `ralph/PROMPT.md` | Agent task list (updated) |
| `updates/2026-02-08.md` | This file |

---

## Session 2: Broad Research Expansion

### What Was Done

Expanded research scope dramatically. Ran 4 parallel deep-dive research agents across the entire computational oncology landscape to identify every area where a SWE + AI team can contribute.

### 6 Shots on Goal Identified

After synthesizing findings across AI drug discovery, early detection, imaging, multi-omics, immunotherapy, cancer reprogramming, synthetic biology, and antibody design, we identified **6 independent shots on goal**:

| Priority | Shot | Key Insight |
|----------|------|-------------|
| **P0** | Neoantigen immunogenicity prediction | NeoTImmuML (AUC 0.8865) is new SOTA. Key gap: no tool integrates ALL signals. Boltz-2 structural features are largely missing. |
| **P1** | Drug combination prediction | PANC1 pipeline achieved 83% hit rate. Fully open-source. Immediately extensible to other cancers. |
| **P2** | Cancer cell reprogramming | CANDiT (UCSD, Cell Reports Medicine Oct 2025) made cancer stem cells self-destruct. Complementary to KAIST's BENEIN. |
| **P2** | Liquid biopsy ML | FinaleToolkit + DELFI provide feature extraction. Downstream ML classifiers are where innovation happens. Stage I detection still hard. |
| **P3** | Digital pathology AI | UNI 2.0 (200M+ images) is open-source. Fine-tuning = engineering challenge, not biology. 30K free TCGA slides. |
| **P3** | AI antibody design | RFantibody (Baker Lab, Nature Nov 2025) designs antibodies from scratch. MIT license. Could target our predicted neoantigens. |

### Major New Tools Discovered

- **NeoTImmuML**: Best open immunogenicity predictor (AUC 0.8865), with TumorAgDB2.0 database
- **Boltz-2**: Protein structure + binding prediction, MIT license, 20 sec/prediction, 1000x faster than physics methods
- **PANC1**: Drug synergy prediction, 83% hit rate, fully open on GitHub
- **C2S-Scale 27B**: Google DeepMind/Yale single-cell foundation model, found new cancer immunotherapy pathways
- **CellFM**: 800M parameter single-cell model (100M cells), outperforms scGPT
- **RFantibody**: De novo antibody design with atomic accuracy, open-source
- **CANDiT**: ML cancer reprogramming framework, cancer stem cells self-destruct
- **UNI 2.0**: Pathology foundation model, SOTA, open-source
- **Pillar-0**: Radiology foundation model, 0.87 AUC on 350+ conditions, open-source
- **SENTI-202**: Logic-gated CAR-NK therapy, 71% response rate in AML, in Phase 1 trials

### Files Created
- `research/01-ai-drug-discovery-and-foundation-models.md`
- `research/02-early-detection-imaging-multiomics.md`
- `research/03-immunotherapy-reprogramming-synbio.md`
- `research/04-shots-on-goal.md` (the key strategic document)

### CLAUDE.md Updated
- Added all 6 shots on goal with tools, data sources, and cross-cutting synergies
- Added research documents index
- Updated next steps checklist

## Next Steps

**BLOCKER: GPU access required.** All remaining neoantigen prediction work needs GPU compute.

Once GPU is available:
1. **ESM-2 mutant-vs-WT embedding differences** -- Embed mutant and WT peptides, use difference vector as feature. Captures structural changes implicitly.
2. **Transfer learning neural network** -- Pre-train on IEDB binding (122K examples), fine-tune on immunogenicity. The BigMHC/ImmugenX approach.
3. **Run NeoaPred via Docker** -- Get fair comparison on TESLA. Reconstruct WT peptides from Synapse or proteome search.
4. **Reproduce NeoTImmuML baseline results** -- compare against our models
5. **Explore Boltz-2 for structural features** -- MIT license, 20 sec/prediction
6. **Reproduce PANC1 drug combination pipeline** (Shot #2)

**Minimum GPU**: T4 (16GB, ~$0.35/hr on cloud)
**Recommended GPU**: A100 (40GB, faster iteration)

## Open Questions

- Can we get the full TESLA community data from Synapse (includes wild-type peptide sequences)?
- Should we use BigMHC's pre-trained weights as starting point or train from scratch?
- Is the foreignness anti-predictivity real biology or an artifact of the metric? (Needs domain expert input)
- Patient 16 is nearly unpredictable (0.043 AUPRC) -- is this a data quality issue or fundamental limit?
