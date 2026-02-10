/**
 * Generates the full TASK.md markdown content from assembled task context.
 *
 * This is the single source of truth for the agent's task — written to the
 * workspace as TASK.md and stored on the Convex task record as contextMarkdown
 * (frozen at claim time, immutable audit trail).
 */

interface Finding {
  findingId: string;
  title?: string;
  summary?: string;
  confidence?: string;
  source?: string;
  implications?: string;
  level: 0 | 1 | 2;
}

interface DeadEnd {
  deadEndId: string;
  what: string;
  whyFailed: string;
}

interface DependencyResult {
  taskId: string;
  result: string;
}

interface PendingFinding {
  findingId: string;
  title: string;
  confidence: string;
  source: string;
  implications: string;
}

interface VerificationFeedback {
  verifier: string;
  verdict: string;
  notes: string;
}

interface TaskContext {
  title?: string;
  question?: string;
  relevantFindings?: Finding[];
  relevantDeadEnds?: DeadEnd[];
  dependencyResults?: DependencyResult[];
  parentResult?: string;
  projectDescription?: string;
  pendingFinding?: PendingFinding;
  verificationFeedback?: VerificationFeedback[];
}

interface TaskRecord {
  _id: string;
  type: "RESEARCH" | "VERIFY";
  priority: number;
  context: TaskContext;
  parentId?: string;
}

export function generateTaskMarkdown(task: TaskRecord): string {
  const ctx = task.context;
  const sections: string[] = [];

  // Header
  sections.push(`# TASK.md`);
  sections.push(``);
  sections.push(`| Field | Value |`);
  sections.push(`|-------|-------|`);
  sections.push(`| **Task ID** | \`${task._id}\` |`);
  sections.push(`| **Type** | ${task.type} |`);
  sections.push(`| **Priority** | P${task.priority} |`);
  if (ctx.title) {
    sections.push(`| **Title** | ${ctx.title} |`);
  }
  sections.push(``);

  // Research question or verification target
  if (task.type === "RESEARCH") {
    if (ctx.question) {
      sections.push(`## Research Question`);
      sections.push(``);
      sections.push(ctx.question);
      sections.push(``);
    }
  }

  // For VERIFY tasks: the finding under review
  if (task.type === "VERIFY" && ctx.pendingFinding) {
    const pf = ctx.pendingFinding;
    sections.push(`## Finding Under Review`);
    sections.push(``);
    sections.push(`| Field | Value |`);
    sections.push(`|-------|-------|`);
    sections.push(`| **Finding ID** | ${pf.findingId} |`);
    sections.push(`| **Title** | ${pf.title} |`);
    sections.push(`| **Confidence** | ${pf.confidence} |`);
    sections.push(`| **Source** | ${pf.source} |`);
    sections.push(``);
    sections.push(`**Implications:** ${pf.implications}`);
    sections.push(``);
  }

  // For forked re-research: previous verification feedback
  if (ctx.verificationFeedback && ctx.verificationFeedback.length > 0) {
    sections.push(`## Previous Verification Feedback`);
    sections.push(``);
    sections.push(
      `This task was created because a previous attempt failed verification. ` +
        `The following feedback was provided by verifiers:`,
    );
    sections.push(``);
    for (const fb of ctx.verificationFeedback) {
      sections.push(`### Verifier: ${fb.verifier}`);
      sections.push(`- **Verdict:** ${fb.verdict}`);
      sections.push(`- **Notes:** ${fb.notes}`);
      sections.push(``);
    }
  }

  // Project description
  if (ctx.projectDescription) {
    sections.push(`## Project Context`);
    sections.push(``);
    sections.push(ctx.projectDescription);
    sections.push(``);
  }

  // Knowledge base context (pyramid summaries)
  const findings = ctx.relevantFindings ?? [];
  const l2 = findings.filter((f) => f.level === 2);
  const l1 = findings.filter((f) => f.level === 1);
  const l0 = findings.filter((f) => f.level === 0);

  if (findings.length > 0) {
    sections.push(`## Knowledge Base Context`);
    sections.push(``);
  }

  if (l2.length > 0) {
    sections.push(`### Dependency Findings (Full Detail)`);
    sections.push(``);
    for (const f of l2) {
      sections.push(`#### ${f.findingId}: ${f.title}`);
      sections.push(`- **Confidence:** ${f.confidence}`);
      sections.push(`- **Source:** ${f.source}`);
      if (f.implications) {
        sections.push(`- **Implications:** ${f.implications}`);
      }
      sections.push(``);
    }
  }

  if (l1.length > 0) {
    sections.push(`### Recent Findings (Summary)`);
    sections.push(``);
    for (const f of l1) {
      sections.push(
        `- **${f.findingId}** [${f.confidence}]: ${f.summary}`,
      );
    }
    sections.push(``);
  }

  if (l0.length > 0) {
    sections.push(`### Other Findings (Brief)`);
    sections.push(``);
    for (const f of l0) {
      sections.push(`- **${f.findingId}**: ${f.summary}`);
    }
    sections.push(``);
  }

  // Dead ends
  const deadEnds = ctx.relevantDeadEnds ?? [];
  if (deadEnds.length > 0) {
    sections.push(`## Dead Ends (Do NOT Repeat)`);
    sections.push(``);
    for (const de of deadEnds) {
      sections.push(`### ${de.deadEndId}: ${de.what}`);
      sections.push(`**Why it failed:** ${de.whyFailed}`);
      sections.push(``);
    }
  }

  // Dependency results
  const depResults = ctx.dependencyResults ?? [];
  if (depResults.length > 0) {
    sections.push(`## Dependency Results`);
    sections.push(``);
    sections.push(
      `The following prerequisite tasks completed before this task was assigned:`,
    );
    sections.push(``);
    for (const dep of depResults) {
      sections.push(`### Task \`${dep.taskId}\``);
      sections.push(``);
      sections.push(dep.result);
      sections.push(``);
    }
  }

  // Parent result (for forked tasks)
  if (ctx.parentResult) {
    sections.push(`## Parent Task Result`);
    sections.push(``);
    sections.push(ctx.parentResult);
    sections.push(``);
  }

  // Acceptance criteria
  sections.push(`## Acceptance Criteria`);
  sections.push(``);

  if (task.type === "RESEARCH") {
    sections.push(
      `- [ ] Submit at least one finding with \`submit_finding\``,
    );
    sections.push(`- [ ] Every finding includes a source citation`);
    sections.push(
      `- [ ] Every finding has an honest confidence level (HIGH, MEDIUM, LOW)`,
    );
    sections.push(
      `- [ ] Record any dead ends encountered with \`record_dead_end\``,
    );
    sections.push(
      `- [ ] Document reasoning process in lab notebook with \`lab_notebook\``,
    );
    sections.push(
      `- [ ] Submit testable hypotheses with \`submit_hypothesis\` when discovered`,
    );
  } else {
    sections.push(
      `- [ ] Verify using a **different method** than the original researcher`,
    );
    sections.push(`- [ ] Check all cited sources for accuracy`);
    sections.push(
      `- [ ] Cross-reference against existing knowledge base findings`,
    );
    sections.push(
      `- [ ] Cast vote with \`cast_vote\` — PASS or FAIL with detailed reasoning`,
    );
    sections.push(`- [ ] When unsure, cast **FAIL**`);
    sections.push(
      `- [ ] Document verification process in lab notebook with \`lab_notebook\``,
    );
  }

  sections.push(``);

  return sections.join("\n");
}
