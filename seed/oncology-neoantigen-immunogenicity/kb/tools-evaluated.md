# Tools Evaluated

Evaluations of bioinformatics tools relevant to our work.
Verdict: USE (adopt), SKIP (not useful), DEFER (evaluate later).

---

### MHCflurry
- **What**: MHC-I peptide binding prediction (neural network)
- **Verdict**: USE -- our first baseline
- **Source**: github.com/openvax/mhcflurry
- **Notes**: Pan-allele model, published benchmarks, pip install. Predicts binding affinity, not immunogenicity.
- **Evaluated**: Pre-project (from literature review)

### NetMHCpan
- **What**: MHC-I binding prediction (neural network, DTU)
- **Verdict**: USE -- second baseline
- **Source**: services.healthtech.dtu.dk/services/NetMHCpan-4.1/
- **Notes**: Gold standard for binding prediction. May require academic license. Web API available.
- **Evaluated**: Pre-project (from literature review)

### NeoTImmuML
- **What**: Neoantigen immunogenicity prediction (multi-layer perceptron)
- **Verdict**: USE -- target to beat (AUC 0.8865)
- **Source**: Paper identified, code availability unknown (Q-003)
- **Notes**: Current SOTA for immunogenicity (not just binding). Integrates multiple features.
- **Evaluated**: Pre-project (from literature review)

### Boltz-2
- **What**: Protein structure prediction (biomolecular complexes)
- **Verdict**: DEFER -- needed for structural features in our model
- **Source**: github.com/jwohlwend/boltz
- **Notes**: Can predict peptide-MHC complex structures. GPU required.
- **Evaluated**: Pre-project (from literature review)

### ESM-2
- **What**: Protein language model (Meta)
- **Verdict**: DEFER -- needed for sequence embeddings
- **Source**: github.com/facebookresearch/esm
- **Notes**: Generates learned representations of protein sequences. GPU needed for large models.
- **Evaluated**: Pre-project (from literature review)

### pVACtools
- **What**: Neoantigen identification pipeline
- **Verdict**: DEFER -- useful for full pipeline but not our current focus
- **Source**: github.com/griffithlab/pVACtools
- **Notes**: Integrates multiple prediction tools. More of an orchestrator than a predictor.
- **Evaluated**: Pre-project (from literature review)
