# RL Environment Design for Neoantigen Prediction

*Inspired by: [Stanford CRFM -- Fast Kernels via Structured Exploratory Search](https://crfm.stanford.edu/2025/05/28/fast-kernels.html)*

---

## The Stanford Approach (What They Did)

Stanford CRFM used LLMs to generate optimized CUDA kernels that **beat PyTorch** (101.3% of torch.matmul for FP32, 179.9% for Conv2D). Their method:

1. **Natural language reasoning first** -- LLM articulates optimization strategies before writing code
2. **Parallel exploration** -- Multiple kernel variants spawn from each idea
3. **Selection pressure** -- Top performers seed subsequent rounds
4. **Iterative refinement** -- 5 rounds, optimal kernels emerged in later rounds

This is essentially **evolutionary search guided by LLM reasoning**. Not traditional RL, but a structured exploration-exploitation loop with a clear fitness function.

## How We Apply This to Neoantigen Prediction

The parallel is direct. Replace "CUDA kernel" with "immunogenicity prediction model" and "execution speed" with "prediction accuracy on TESLA benchmark."

### The Environment

```
┌─────────────────────────────────────────────────────┐
│                    RL ENVIRONMENT                     │
│                                                       │
│  State:   Current best model architecture + weights   │
│           + performance metrics on validation set      │
│                                                       │
│  Actions: Architectural modifications                  │
│           - Change feature extraction (ESM-2, BLOSUM,  │
│             one-hot, structure-based)                   │
│           - Change model type (transformer, GNN, MLP,  │
│             ensemble)                                  │
│           - Change training strategy (loss function,    │
│             data augmentation, curriculum learning)     │
│           - Change hyperparameters                      │
│                                                       │
│  Reward:  Delta in TESLA benchmark accuracy             │
│           (AUC-ROC improvement over previous best)      │
│                                                       │
│  Terminal: Exceeds state-of-the-art OR budget exhausted │
└─────────────────────────────────────────────────────┘
```

### Structured Exploratory Search (Our Version)

**Round 1: Feature Exploration**
- Spawn N model variants, each using a different feature representation:
  - A: Raw peptide sequence (one-hot encoded)
  - B: BLOSUM substitution matrix features
  - C: ESM-2 protein language model embeddings
  - D: Structural features from AlphaFold predictions
  - E: Combination features (sequence + expression level + clonality)
- Train all on IEDB, evaluate on held-out validation set
- Select top K performers

**Round 2: Architecture Search**
- For each top-K feature set, spawn model architecture variants:
  - Transformer encoder
  - Graph neural network (peptide-MHC interaction graph)
  - Attention-based MLP
  - Ensemble of above
- Train, evaluate, select top K

**Round 3: Training Strategy Optimization**
- For top-K models, vary training approach:
  - Standard cross-entropy vs. focal loss (handles class imbalance)
  - With/without data augmentation (peptide mutation, homolog expansion)
  - Curriculum learning (easy examples first, hard examples later)
  - Multi-task learning (binding + immunogenicity jointly)
- Train, evaluate, select top K

**Round 4: Hyperparameter Refinement**
- Learning rate, batch size, regularization, ensemble weights
- Bayesian optimization or random search within top-K architectures

**Round 5: Final Evaluation**
- Top models evaluated on TESLA benchmark (held-out test set)
- Compare against published baselines

### Why LLM-Guided Search (Not Just Grid Search)

The Stanford insight: LLMs can **reason about WHY** a modification might help before trying it. Applied to our problem:

- LLM reads error analysis from Round N ("model fails on short peptides with low binding affinity")
- LLM reasons: "Short peptides may need positional encoding that accounts for peptide length. Low binding affinity failures suggest the model conflates binding with immunogenicity -- adding a separate binding prediction head might help disentangle these."
- LLM generates specific code modifications
- Multiple variants tested in parallel

This is where the **Ralph loop connects to the RL environment**: each Ralph iteration can be one round of exploratory search. The LLM reads progress.md (previous round results), reasons about what to try next, implements it, evaluates, and records results.

## Implementation Plan

### Phase 1: Evaluation Harness (build first)
```
tools/
├── evaluate.py          # Standardized evaluation on TESLA benchmark
├── train.py             # Training loop with configurable model/features
├── features/
│   ├── sequence.py      # Sequence-based features
│   ├── esm2.py          # ESM-2 embeddings
│   └── structure.py     # Structure-based features
├── models/
│   ├── transformer.py   # Transformer architecture
│   ├── gnn.py           # Graph neural network
│   └── ensemble.py      # Ensemble methods
└── search/
    ├── explorer.py      # Structured search orchestrator
    └── results.json     # Results from all rounds
```

The evaluation harness is the "fitness function." It must be:
- Deterministic (same model + same data = same score)
- Fast (minutes, not hours, per evaluation)
- Comprehensive (AUC, precision, recall, F1, per-allele breakdown)

### Phase 2: Feature + Model Zoo
Build a library of interchangeable components. Each feature extractor and model architecture implements a standard interface so they can be mixed and matched by the search process.

### Phase 3: Search Loop
Either:
- **Ralph-powered**: Each Ralph iteration = one search round. LLM reads results, reasons, generates next variant.
- **Programmatic**: Python script that spawns training runs in parallel, selects top K, feeds into next round.
- **Hybrid** (recommended): Programmatic search for hyperparameters, LLM-guided search for architectural decisions.

## Connection to Ralph Loop

The ralph loop and RL environment are complementary:

```
Ralph Loop (outer)
  │
  ├── Iteration 1: Set up evaluation harness
  ├── Iteration 2: Implement feature extractors
  ├── Iteration 3: Run Round 1 (feature exploration)
  ├── Iteration 4: Analyze Round 1 results, design Round 2
  ├── Iteration 5: Run Round 2 (architecture search)
  │   ...
  └── Iteration N: Final TESLA benchmark evaluation
```

Each Ralph iteration has clean context but reads accumulated results from `search/results.json` and `ralph/progress.md`. The LLM reasons about what to try next based on what worked and failed in previous rounds.

## Compute Requirements

- **Feature extraction** (ESM-2): ~1 GPU-hour for IEDB dataset (one-time)
- **Training per model variant**: ~10-30 min on single GPU (small dataset)
- **Full search (5 rounds x 10 variants)**: ~25-50 GPU-hours
- **Feasible on**: Single A100, or distributed across consumer GPUs

This is very reasonable. The Stanford paper ran their kernel search in a few hours.

## Success Criteria

1. **Minimum**: Reproduce published baselines on TESLA benchmark
2. **Target**: Beat state-of-the-art by 2+ AUC points
3. **Stretch**: Identify novel feature combinations or architectures that generalize across cancer types

## Open Questions

- What's the exact TESLA benchmark evaluation protocol? (need to read the paper carefully)
- Can we get ESM-2 embeddings for all peptides in IEDB efficiently?
- Should we include peptide-MHC structural predictions (AlphaFold) as features, or is this too slow?
- How do we handle the class imbalance problem? (far more non-immunogenic than immunogenic peptides in training data)

## References

- [Stanford CRFM Fast Kernels](https://crfm.stanford.edu/2025/05/28/fast-kernels.html)
- [TESLA Consortium](https://www.nature.com/articles/s41587-019-0302-x) -- benchmark we're targeting
- [ESM-2](https://github.com/facebookresearch/esm) -- protein language model for feature extraction
- [MHCflurry](https://github.com/openvax/mhcflurry) -- baseline binding predictor
- [DeepImmuno](https://academic.oup.com/bib/article/22/6/bbab160/6261914) -- immunogenicity prediction
