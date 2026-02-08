# Skill: Run Experiment

## When to use
When assigned a BUILD task that produces measurable results.

## Steps

1. **Before running**
   - Check lab/kb/dead-ends.md -- has this been tried before?
   - Document: hypothesis, method, expected outcome, success criteria
   - Ensure evaluation script exists BEFORE training script

2. **Setup**
   - Record all dependencies with versions
   - Record random seed, data split, hardware used
   - Create a script that can be re-run by anyone
   - Add clear docstring at top of every script

3. **Execute**
   - Run the experiment
   - Capture all output (stdout, metrics, errors)
   - If it fails, use `lab_record_dead_end` immediately -- don't waste more iterations

4. **Record results**
   - Use `lab_append_finding` with exact numbers
   - Include: metric name, value, dataset, split, seed
   - Compare to known baselines (check lab/kb/findings.md)

5. **Validate**
   - Do results make sense? (sanity check against known values)
   - Is there data leakage? (check train/test split for overlap)
   - Are we measuring the right metric? (AUC-ROC for imbalanced data)
   - If results seem too good, double-check methodology
