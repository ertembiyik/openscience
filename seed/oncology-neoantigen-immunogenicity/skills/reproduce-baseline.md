# Skill: Reproduce Baseline

## When to use
When assigned a BUILD task to install and evaluate an existing prediction tool.

## Steps

1. **Before running**
   - Check lab/kb/dead-ends.md -- has someone already tried this?
   - Check lab/kb/tools-evaluated.md -- any known issues?
   - Document: what tool, what version, what data, what metric we expect

2. **Install**
   - Follow official installation instructions exactly
   - Record all dependency versions in a requirements file
   - If install fails, try alternative method (pip vs conda vs docker)
   - If all methods fail, record in lab/kb/dead-ends.md and set task BLOCKED

3. **Prepare data**
   - Use our standardized data loader (tools/data/)
   - Ensure same train/test split as will be used for our model
   - Document the exact dataset version and filtering applied

4. **Run prediction**
   - Run the tool on our test set
   - Capture all output (predictions, scores, timings)
   - Save raw predictions to data/ for later comparison

5. **Evaluate**
   - Run tools/evaluate.py (or write it if it doesn't exist yet)
   - Record: AUC-ROC, AUC-PR, precision, recall, F1
   - Compare to published numbers -- do we reproduce them?

6. **Record results**
   - Use `lab_append_finding` with exact metric values
   - If results differ from published: investigate why, record discrepancy
   - Save evaluation script and command used (must be reproducible)
