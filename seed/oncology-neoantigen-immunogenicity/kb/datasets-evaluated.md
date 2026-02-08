# Datasets Evaluated

Evaluations of datasets relevant to our work.

---

### IEDB (Immune Epitope Database)
- **What**: Curated database of experimentally validated immune epitopes
- **Size**: ~600K+ entries (needs filtering to T-cell assays)
- **Access**: Public, bulk download available at iedb.org
- **Relevance**: Training data for immunogenicity prediction
- **Status**: NOT YET DOWNLOADED
- **Notes**: Need to filter to T-cell assays with positive/negative labels. Multiple assay types -- must standardize.

### TESLA Consortium
- **What**: Benchmark dataset for neoantigen prediction validation
- **Source**: Wells et al., Nature Biotechnology 2020
- **Access**: UNKNOWN -- may require application (Q-001)
- **Relevance**: PRIMARY evaluation benchmark for our model
- **Status**: NOT YET ACCESSED
- **Notes**: This is the gold standard. Must match their exact evaluation protocol.

### TCGA (The Cancer Genome Atlas)
- **What**: Multi-omic cancer data (genomic, transcriptomic, clinical)
- **Size**: ~30K samples across 33 cancer types
- **Access**: Public (GDC portal), some data requires dbGaP access
- **Relevance**: Tumor mutation data, expression data, clinical outcomes
- **Status**: NOT YET EXPLORED
- **Notes**: Useful for training and validation but secondary to TESLA for benchmarking.

### TumorAgDB2.0
- **What**: Database of tumor antigens
- **Access**: Public
- **Relevance**: Supplementary training data for neoantigen prediction
- **Status**: NOT YET EXPLORED

### DrugComb
- **What**: 740K drug combination experiments
- **Relevance**: Shot 2 (drug combination prediction), not current focus
- **Status**: NOT NEEDED YET
