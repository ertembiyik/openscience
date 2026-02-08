# Skill: Literature Review

## When to use
When assigned a RESEARCH task that involves reading/analyzing a paper or body of work.

## Steps

1. **Find the paper**
   - Search by title, DOI, or author using `paper_search` tool or WebSearch
   - If behind paywall, check for preprint on arXiv/bioRxiv/medRxiv
   - If unavailable, add to lab/kb/open-questions.md and set task BLOCKED

2. **Read and extract**
   - What problem does it solve?
   - What method do they use? (algorithm, model architecture, training data)
   - What are the key results? (specific numbers: AUC, accuracy, sample size)
   - What are the limitations they acknowledge?
   - What data/code is publicly available? (GitHub links, dataset names)

3. **Assess relevance to our work**
   - Does this help Shot 1 (neoantigen immunogenicity prediction)? How specifically?
   - Does it introduce a tool or dataset we should evaluate?
   - Does it contradict any of our existing findings in lab/kb/findings.md?
   - What can we learn from their approach that we're not doing?

4. **Record findings**
   - Write narrative summary to `research/<paper-slug>.md`
   - Use `lab_append_finding` for each structured fact (with confidence + source)
   - If tool mentioned, add evaluation to lab/kb/tools-evaluated.md
   - If dataset mentioned, add evaluation to lab/kb/datasets-evaluated.md
   - If unanswered question, add to lab/kb/open-questions.md

5. **Validate**
   - Every biological claim has a confidence level (HIGH/MEDIUM/LOW)
   - Every number has a source citation
   - Explain terms in plain language (Ertem is an SWE, not a biologist)
   - If uncertain about a claim, flag it explicitly
