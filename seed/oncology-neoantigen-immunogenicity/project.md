# Neoantigen Immunogenicity Prediction

## Slug
oncology/neoantigen-immunogenicity

## Field
oncology

## Description

Given a cancer patient's tumor mutations and immune profile (HLA type), predict which mutated proteins (neoantigens) will actually trigger a T-cell immune response when encoded in an mRNA vaccine.

This is the computational bottleneck in personalized mRNA cancer vaccines. Moderna/Merck's melanoma vaccine showed 49% reduction in cancer recurrence at 5 years. BioNTech's pancreatic cancer trial: 50% of patients responded. The other 50% didn't -- likely because the wrong neoantigens were selected.

Current best: NeoTImmuML at AUC 0.8865, but still not good enough. No tool integrates ALL signals (MHC binding + TCR recognition + clonality + expression + proteasomal processing + structure). We believe structural features from Boltz-2 + learned representations from ESM-2 can capture TCR recognition patterns that sequence-based features miss.

## Key Signals

1. **MHC-I binding affinity** -- Does the peptide bind to the patient's HLA molecules? (MHCflurry, NetMHCpan)
2. **TCR recognition** -- Can T-cell receptors recognize the peptide-MHC complex? (hardest part)
3. **Clonality** -- Is the mutation present in most tumor cells? (variant allele frequency)
4. **Expression level** -- Is the mutated gene actively expressed? (RNA-seq)
5. **Proteasomal processing** -- Will the cell's machinery generate the peptide? (NetChop, PCPS)
6. **Structural features** -- 3D structure of peptide-MHC complex (Boltz-2, ESM-2)

## Success Metric

Beat TESLA benchmark AUC-ROC (current SOTA: NeoTImmuML 0.8865) and AUPRC (current best we've achieved: 0.212).

## Key Tools

MHCflurry, NetMHCpan, OpenVax, pVACtools, Boltz-2, ESM-2, NeoTImmuML, DeepNeo

## Key Datasets

IEDB (Immune Epitope Database), TESLA Consortium (Nature Biotech 2020), TCGA, TumorAgDB2.0, Human Protein Atlas

## Seed Data

This directory contains the initial knowledge base, research documents, task backlog, skills, and tools accumulated from the project's first sprint (Feb 2026).

- `research/` -- 11 literature reviews and analysis documents
- `kb/` -- Knowledge base (findings, dead-ends, open questions, tool/dataset evaluations)
- `tasks/backlog.md` -- 18 research tasks ready for the task DAG
- `skills/` -- 5 research workflow checklists
- `tools/` -- 7 Python scripts (data loading, feature engineering, baselines, evaluation)
- `docs/` -- Progress reports and design documents
