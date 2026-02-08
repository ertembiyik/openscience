# Skill: Tool Evaluation

## When to use
When assigned a task to evaluate a bioinformatics tool or software package.

## Steps

1. **Find the tool**
   - Locate GitHub repo, documentation, and original paper
   - Check: is it actively maintained? Last commit date? Stars/forks?
   - Check: license type (can we use it?)

2. **Assess capabilities**
   - What does it do? (one sentence)
   - What inputs does it need? (data format, dependencies)
   - What outputs does it produce?
   - How does it compare to alternatives we already know about?

3. **Try to install/run**
   - Follow their install instructions
   - Run their example or quickstart
   - Record any issues (missing deps, broken links, unclear docs)
   - If install fails, record in lab/kb/dead-ends.md

4. **Evaluate relevance**
   - Does it solve a problem we have?
   - Can it integrate with our pipeline?
   - What's the compute requirement? (CPU-only? GPU needed? How much?)

5. **Record verdict**
   - Add evaluation to lab/kb/tools-evaluated.md with verdict:
     - **USE**: Adopt now, integrate into our pipeline
     - **SKIP**: Not useful for our current work
     - **DEFER**: Potentially useful later (e.g., needs GPU we don't have yet)
   - Use `lab_append_finding` for any key facts discovered
