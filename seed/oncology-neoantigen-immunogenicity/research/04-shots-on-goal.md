# Shots on Goal: Where We Can Contribute to Curing Cancer

*Feb 2026 | Ertem (SWE) + Claude (AI Co-Researcher)*

---

## The Big Picture

After broad research across every major front in computational oncology (Feb 2026), we've identified **6 distinct "shots on goal"** -- independent problem areas where a SWE + AI team can make real contributions without a wet lab. Each has open data, open-source baselines, and clearly defined computational bottlenecks.

We should pick **2-3 to pursue in parallel**, not just one. The cancer problem is massive and our computational skills apply across multiple fronts.

---

## Shot 1: Neoantigen Immunogenicity Prediction (our current focus)

**The problem**: Predict which of a cancer patient's mutations will trigger an immune response when encoded in an mRNA vaccine. Current best: AUC ~0.89 (NeoTImmuML). Still not good enough -- BioNTech's pancreatic trial had only 50% responders.

**Why it matters**: Moderna/Merck melanoma vaccine Phase III is FULLY ENROLLED. Better neoantigen selection = more patients respond = more lives saved. Phase III readouts expected 2026-2027.

**What's new since our last review**:
- NeoTImmuML (2025): AUC 0.8865, open-source with TumorAgDB2.0 database
- NeoPrecis (2025): Adds clonality awareness to neoantigen ranking
- ImmuniT Platform: Lung cancer-specific neoantigen prediction
- HLAIIPred: HLA-II prediction (helper T-cells, not just killer T-cells)
- **Key gap**: No tool integrates ALL signals (MHC binding + TCR recognition + clonality + expression + processing + structure). Building a unified multi-modal predictor is still wide open.

**Our edge**: We can use Boltz-2 (free, MIT license) for structural features of peptide-MHC complexes as input to our predictor. This structural information is largely missing from current tools.

**Open tools**: NeoTImmuML, MHCflurry, NetMHCpan, DeepNeo, pVACtools, OpenVax, Boltz-2
**Open data**: IEDB, TESLA, TCGA, TumorAgDB2.0, Human Protein Atlas

**Effort to first results**: 2-4 weeks to reproduce baselines, 2-3 months to improve

---

## Shot 2: Drug Combination Prediction for Cancer

**The problem**: Find which pairs/combinations of existing drugs work synergistically against specific cancers. Testing all combinations in the lab is impossibly slow. AI can screen millions computationally.

**Why it matters**: Pancreatic cancer has ~12% five-year survival. The NIH/MIT/UNC team used graph neural networks to achieve **83% hit rate** predicting synergistic drug pairs. 307 validated combinations found for pancreatic cancer alone. This approach is directly extensible to other cancer types.

**What's available**:
- NCATS PANC1 pipeline: fully open-source (github.com/ncats/PANC1), Python/PyTorch/RDKit
- SynerGNet, GraphSynergy, SynergyGraph: open-source GNN tools
- DrugComb database: 740K drug combination experiments
- NCI-ALMANAC: large-scale screening data
- ML + RAG approach for explainable predictions (2025)
- UniSyn: multi-modal framework (Genome Biology 2026)

**What we could build**:
1. Extend the PANC1 pipeline to other deadly cancers (lung, brain, ovarian)
2. Build a model that combines drug synergy prediction WITH immunotherapy response -- which drug combos make tumors more vulnerable to vaccines?
3. Create an open-source drug combination screening service

**Effort to first results**: 2-3 weeks to reproduce PANC1 baselines, 1-2 months to extend

---

## Shot 3: Cancer Cell Reprogramming Target Discovery

**The problem**: Instead of killing cancer cells (chemo, radiation), force them to become normal cells again. Two labs have shown this works computationally: KAIST's BENEIN (Boolean networks) and UCSD's CANDiT (genome-wide ML).

**Why it matters**: Reprogramming avoids the toxicity of killing approaches. KAIST reverted colorectal cancer cells to normal in mice. UCSD's approach made cancer stem cells self-destruct. Both are purely computational discoveries validated in the lab.

**What's available**:
- BENEIN: Boolean network inference, validated for colorectal cancer
- CANDiT: ML framework, published Cell Reports Medicine Oct 2025
- TCGA: publicly available genomic data for 33 cancer types
- Single-cell RNA-seq data: publicly available via Human Cell Atlas
- Generative deep learning for cell perturbation (KAIST, Cell Systems Oct 2025)

**What we could build**:
1. Apply BENEIN/CANDiT approaches to NEW cancer types using public scRNA-seq data
2. Combine reprogramming targets with neoantigen prediction: dual strategy for same tumor
3. Use C2S-Scale 27B or scGPT to scale beyond individual gene knockdowns to multi-gene interventions

**Effort to first results**: 3-4 weeks to understand and reproduce methods, 2-3 months to apply to new cancers

---

## Shot 4: Liquid Biopsy ML Classifiers (Early Detection)

**The problem**: Detect cancer from a simple blood test. Cell-free DNA (cfDNA) in blood carries signals of cancer. Current ML classifiers extract fragmentation patterns, methylation signals, and fragment-size distributions to classify cancer vs. healthy.

**Why it matters**: Early detection saves lives -- 5-year survival for Stage I cancers is 5-10x higher than Stage IV. Galleri can detect 50+ cancer types from blood. DELFI detected lung cancer with 94% sensitivity. But Stage I detection rates are still low (~17-80% depending on approach).

**What's available**:
- FinaleToolkit: open-source cfDNA feature extraction (50x faster than alternatives)
- DELFI scripts: open-source (github.com/cancer-genomics/delfi_scripts)
- FinaleDB: open cfDNA fragmentation database
- Flomics (cfRNA approach): 80% Stage I sensitivity -- RNA may be more sensitive than DNA
- TCGA has cfDNA data for many cancer types

**What we could build**:
1. Better downstream ML classifiers on extracted fragmentation features (pure ML problem)
2. Multi-analyte models combining cfDNA + cfRNA signals
3. Cancer type-of-origin classifiers (not just "is there cancer?" but "where is the cancer?")

**Effort to first results**: 2-3 weeks to reproduce baselines, 2-3 months to innovate

---

## Shot 5: Digital Pathology AI for Cancer

**The problem**: Pathologists examine tissue slides to diagnose cancer -- subjective, slow, and varies between pathologists. AI can analyze gigapixel whole-slide images at scale.

**Why it matters**: Foundation models (UNI 2.0, CONCH) are now open-source and state-of-the-art. 30,000 TCGA slides are freely available. But fine-tuning these models for specific clinical questions is the bottleneck -- an engineering challenge, not a biology challenge.

**What's available**:
- UNI 2.0 (Harvard): Open-source, 200M+ images, SOTA on 20+ benchmarks
- CONCH: Vision-language model for pathology (open-source)
- MedSAM2: Segment tumors from prompts (open-source)
- Pillar-0: 3D radiology foundation model (open-source, 0.87 AUC on 350+ findings)
- TCGA slides: ~30,000 free diagnostic slides

**What we could build**:
1. Fine-tune UNI 2.0 for tumor mutational burden prediction from H&E slides (connects to neoantigen work)
2. Build immune infiltration classifiers (predicts vaccine response)
3. Create open benchmarks for pathology AI

**Effort to first results**: 1-2 weeks with GPU access, 1-2 months to innovate

---

## Shot 6: Antibody/Protein Design for Cancer Targets

**The problem**: Design therapeutic proteins (antibodies, nanobodies, binders) that target specific cancer markers. Traditionally requires years of lab work. Now AI can design them in seconds.

**Why it matters**: RFantibody (Baker Lab, Nature Nov 2025) designs antibodies from scratch with atomic accuracy. Boltz-2 predicts structure + binding in 20 seconds. Both MIT-licensed and open-source. 15 ADCs are FDA-approved with more coming.

**What's available**:
- RFantibody: github.com/RosettaCommons/RFantibody (MIT license)
- Boltz-2/BoltzGen: github.com/jwohlwend/boltz (MIT license)
- AlphaFold3: structure prediction (limited license)

**What we could build**:
1. Design antibodies targeting neoantigens WE identify with our immunogenicity predictor
2. Design bispecific antibodies connecting immune cells to specific cancer targets
3. Optimize antibody-drug conjugate components computationally

**Effort to first results**: Requires significant GPU compute. 1-2 months to run meaningful designs.

---

## Recommended Portfolio Strategy

### Start Now (Weeks 1-4):

| Priority | Shot | Why First |
|----------|------|-----------|
| **P0** | Shot 1: Neoantigen Prediction | Most defined problem, most data, closest to clinical impact |
| **P1** | Shot 2: Drug Combinations | PANC1 repo is immediately runnable, extends naturally |

### Start Month 2:

| Priority | Shot | Why |
|----------|------|-----|
| **P2** | Shot 3: Cancer Reprogramming | Novel, high-ceiling, connects to Shot 1 |
| **P2** | Shot 4: Liquid Biopsy ML | Pure ML problem, great data availability |

### Start When Ready:

| Priority | Shot | Why Wait |
|----------|------|----------|
| **P3** | Shot 5: Digital Pathology | Needs GPU resources |
| **P3** | Shot 6: Antibody Design | Needs more compute, more structural biology expertise |

---

## Cross-Cutting Connections

The shots are NOT independent. Key synergies:

```
Shot 1 (Neoantigens) ---> use Boltz-2 structural features from Shot 6
Shot 1 (Neoantigens) ---> combined with Shot 3 reprogramming = dual strategy
Shot 2 (Drug Combos) ---> which drugs make tumors more vulnerable to Shot 1 vaccines?
Shot 3 (Reprogramming) ---> uses same scRNA-seq/TCGA data infrastructure as Shot 1
Shot 4 (Liquid Biopsy) ---> monitor response to Shot 1 vaccines via blood
Shot 5 (Pathology) ---> predict tumor mutational burden for Shot 1 neoantigen selection
```

The more shots we pursue, the more they strengthen each other.

---

## Open-Source Tools Master List

| Tool | What | GitHub | License |
|------|------|--------|---------|
| Boltz-2 | Protein structure + binding | jwohlwend/boltz | MIT |
| RFantibody | De novo antibody design | RosettaCommons/RFantibody | MIT |
| PANC1 | Drug synergy prediction | ncats/PANC1 | Open |
| NeoTImmuML | Neoantigen immunogenicity | See paper | Open |
| MHCflurry | MHC binding prediction | openvax/mhcflurry | Apache 2.0 |
| OpenVax | Neoantigen vaccine pipeline | openvax | Apache 2.0 |
| pVACtools | Neoantigen prioritization | griffithlab/pVACtools | BSD |
| scGPT | Single-cell foundation model | bowang-lab/scGPT | Open |
| Flexynesis | Multi-omics integration | BIMSBbioinfo/flexynesis | PolyForm NC |
| FinaleToolkit | cfDNA fragmentomics | Published | Open |
| DELFI | cfDNA cancer detection | cancer-genomics/delfi_scripts | Open |
| UNI 2.0 | Pathology foundation model | mahmoodlab/UNI | Open |
| MedSAM2 | Medical image segmentation | bowang-lab/MedSAM2 | Open |
| TumorTwin | Digital twin framework | OncologyModelingGroup/TumorTwin | Open |
| PhysiCell | Agent-based tumor sim | MathCancer/PhysiCell | BSD |
| SynerGNet | Drug synergy GNN | MengLiu90/SynerGNet | Open |

---

*This is a living document. Updated as we make progress and as new breakthroughs emerge.*
