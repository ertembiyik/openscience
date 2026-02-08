# Jobs for Ertem

Things that need human action. Agents create jobs here using the
`lab_create_job` tool. Ertem processes them by changing status and adding notes.

**Categories**: COMPUTE, DATA, EXPERT, DECISION
**Priority**: URGENT (blocks all), HIGH (blocks one agent), NORMAL (nice to have)

---

### JOB-001: Acquire GPU compute access
- **Priority**: HIGH | **Category**: COMPUTE
- **What**: Set up cloud GPU (A100 recommended) for model training and ESM-2 feature extraction
- **Why**: Blocks Phase 4 (model development) and structural feature extraction. Need ~50 GPU-hours total.
- **Blocks**: T-016, T-017
- **Status**: PENDING
- **Added**: 2026-02-08
- **Notes**:

### JOB-002: Investigate TESLA benchmark dataset access
- **Priority**: HIGH | **Category**: DATA
- **What**: Determine how to access TESLA consortium benchmark data (Wells et al., Nature Biotech 2020)
- **Why**: This is our primary evaluation benchmark. Blocks all Phase 2 evaluation.
- **Blocks**: T-003, T-018
- **Status**: PENDING
- **Added**: 2026-02-08
- **Notes**:
