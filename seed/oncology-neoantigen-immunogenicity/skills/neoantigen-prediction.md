# Skill: Neoantigen Prediction Pipeline

## When to use
Domain-specific skill for Shot 1 tasks. Reference for understanding the
full prediction pipeline.

## The Problem

Given a cancer patient's tumor mutations and immune profile (HLA type),
predict which mutated proteins (neoantigens) will trigger a T-cell immune
response when encoded in an mRNA vaccine.

## Current SOTA
- NeoTImmuML: AUC 0.8865 (our target to beat)
- BioNTech pancreatic trial: only 50% responder rate (room for improvement)

## Key Signals (what predicts immunogenicity)

1. **MHC-I binding affinity** -- Does the peptide bind to the patient's HLA molecules?
   - Tools: MHCflurry, NetMHCpan
   - Necessary but not sufficient (many peptides bind but don't trigger T-cells)

2. **TCR recognition** -- Can T-cell receptors recognize the peptide-MHC complex?
   - This is the hardest part to predict
   - Depends on peptide surface exposure, charge distribution, structural properties

3. **Clonality** -- Is the mutation present in most tumor cells?
   - Higher clonality = better vaccine target
   - Measured from variant allele frequency (VAF) in sequencing data

4. **Expression level** -- Is the mutated gene actively expressed?
   - No expression = no peptide presented on cell surface
   - Measured from RNA-seq data

5. **Proteasomal processing** -- Will the cell's protein recycling machinery actually cut the protein at the right positions to generate the peptide?
   - Tools: NetChop, PCPS

6. **Structural features** -- 3D structure of peptide-MHC complex
   - Largely missing from current tools (our key innovation opportunity)
   - Tools: Boltz-2 for structure prediction, ESM-2 for learned representations

## Our Approach

Integrate ALL 6 signals into a single predictor. Current tools use 1-3 of these.
The hypothesis: structural features from Boltz-2 + learned representations from
ESM-2 can capture TCR recognition patterns that sequence-based features miss.

## Data Flow

```
Patient tumor DNA → Variant calling → Peptide generation →
  → MHC binding prediction (MHCflurry/NetMHCpan)
  → Sequence features (amino acid properties, BLOSUM encoding)
  → ESM-2 embeddings (learned protein representations)
  → Structural features (Boltz-2 peptide-MHC complex)
  → Expression level (from RNA-seq)
  → Clonality (from variant allele frequency)
→ Combined feature vector → Our model → Immunogenicity score
```
