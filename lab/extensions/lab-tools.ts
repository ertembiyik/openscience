/**
 * Lab Tools Extension
 *
 * Structured tools for updating the research lab knowledge base.
 * These enforce consistent formatting so agents can't accidentally
 * mess up the KB structure.
 *
 * Tools:
 * - lab_append_finding: Record a validated finding
 * - lab_record_dead_end: Record what didn't work
 * - lab_update_task: Update task status
 * - lab_create_job: Create a job for Ertem
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

function getLabDir(): string {
  return join(process.cwd(), "lab");
}

function getNextId(filePath: string, prefix: string): string {
  if (!existsSync(filePath)) return `${prefix}-001`;
  const content = readFileSync(filePath, "utf-8");
  const matches = content.match(new RegExp(`${prefix}-(\\d+)`, "g")) || [];
  if (matches.length === 0) return `${prefix}-001`;
  const maxNum = Math.max(
    ...matches.map((m) => parseInt(m.replace(`${prefix}-`, ""), 10))
  );
  return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

export default function (pi: ExtensionAPI) {
  // --- Append Finding ---
  pi.registerTool({
    name: "lab_append_finding",
    label: "Append Finding",
    description:
      "Append a validated finding to lab/kb/findings.md. Use this to record facts discovered during research or experiments.",
    parameters: Type.Object({
      title: Type.String({
        description: "One-line finding statement (e.g. 'IEDB contains 147K usable T-cell assay records')",
      }),
      confidence: Type.Union(
        [
          Type.Literal("HIGH"),
          Type.Literal("MEDIUM"),
          Type.Literal("LOW"),
        ],
        { description: "HIGH = reproduced/verified, MEDIUM = strong evidence, LOW = preliminary" }
      ),
      source: Type.String({
        description: "How we know this (paper DOI, experiment output, tool docs, etc.)",
      }),
      implications: Type.String({
        description: "What this means for our work (1-2 sentences)",
      }),
    }),
    execute: async (_toolCallId, params) => {
      const filePath = join(getLabDir(), "kb", "findings.md");
      const id = getNextId(filePath, "F");
      const date = new Date().toISOString().slice(0, 10);

      const entry = `
### ${id}: ${params.title}
- **Confidence**: ${params.confidence}
- **Source**: ${params.source}
- **Date**: ${date}
- **Implications**: ${params.implications}
`;

      const content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
      writeFileSync(filePath, content + entry);

      return {
        content: [{ type: "text" as const, text: `Finding ${id} recorded.` }],
        details: {},
      };
    },
  });

  // --- Record Dead End ---
  pi.registerTool({
    name: "lab_record_dead_end",
    label: "Record Dead End",
    description:
      "Record an approach that didn't work to lab/kb/dead-ends.md. This prevents other agents from repeating the same mistake.",
    parameters: Type.Object({
      what: Type.String({
        description: "What was tried (brief description)",
      }),
      why_failed: Type.String({
        description: "Why it failed (root cause)",
      }),
      iterations_spent: Type.Number({
        description: "How many iterations were spent on this",
      }),
      lesson: Type.String({
        description: "What to do differently next time",
      }),
    }),
    execute: async (_toolCallId, params) => {
      const filePath = join(getLabDir(), "kb", "dead-ends.md");
      const id = getNextId(filePath, "DE");

      const entry = `
### ${id}: ${params.what}
- **What**: ${params.what}
- **Why failed**: ${params.why_failed}
- **Iterations spent**: ${params.iterations_spent}
- **Lesson**: ${params.lesson}
`;

      const content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
      writeFileSync(filePath, content + entry);

      return {
        content: [{ type: "text" as const, text: `Dead end ${id} recorded.` }],
        details: {},
      };
    },
  });

  // --- Update Task ---
  pi.registerTool({
    name: "lab_update_task",
    label: "Update Task",
    description:
      "Update a task's status in lab/tasks/active.md. Use when completing, blocking, or noting progress on a task.",
    parameters: Type.Object({
      task_id: Type.String({
        description: "Task ID (e.g. 'T-003')",
      }),
      status: Type.Union(
        [
          Type.Literal("IN_PROGRESS"),
          Type.Literal("DONE"),
          Type.Literal("STUCK"),
          Type.Literal("BLOCKED"),
        ],
        { description: "New status for the task" }
      ),
      note: Type.Optional(
        Type.String({
          description: "Progress note or reason for status change",
        })
      ),
      result_ref: Type.Optional(
        Type.String({
          description: "Reference to result (e.g. 'F-012' or 'tools/loader.py')",
        })
      ),
    }),
    execute: async (_toolCallId, params) => {
      const filePath = join(getLabDir(), "tasks", "active.md");
      if (!existsSync(filePath)) {
        return {
          content: [{ type: "text" as const, text: "active.md not found." }],
          details: {},
        };
      }

      let content = readFileSync(filePath, "utf-8");

      // Find the task line and update status
      const taskPattern = new RegExp(
        `(\\|\\s*${params.task_id}\\s*\\|[^|]*\\|[^|]*\\|[^|]*\\|)\\s*(\\w+)`,
      );
      if (taskPattern.test(content)) {
        content = content.replace(taskPattern, `$1 ${params.status}`);
        if (params.note) {
          content = content.replace(
            new RegExp(`(${params.task_id}.*${params.status})`),
            `$1 -- ${params.note}`
          );
        }
      } else {
        // If not found in table format, append a note
        content += `\n\n**Update ${params.task_id}**: Status → ${params.status}${params.note ? ` (${params.note})` : ""}${params.result_ref ? ` Result: ${params.result_ref}` : ""}\n`;
      }

      writeFileSync(filePath, content);

      return {
        content: [
          {
            type: "text" as const,
            text: `Task ${params.task_id} updated to ${params.status}.`,
          },
        ],
        details: {},
      };
    },
  });

  // --- Create Job for Ertem ---
  pi.registerTool({
    name: "lab_create_job",
    label: "Create Job for Ertem",
    description:
      "Create a job in lab/jobs-for-ertem.md for things that need human action (GPU access, dataset registration, researcher contact, decisions).",
    parameters: Type.Object({
      priority: Type.Union(
        [
          Type.Literal("URGENT"),
          Type.Literal("HIGH"),
          Type.Literal("NORMAL"),
        ],
        { description: "Job priority" }
      ),
      category: Type.Union(
        [
          Type.Literal("COMPUTE"),
          Type.Literal("DATA"),
          Type.Literal("EXPERT"),
          Type.Literal("DECISION"),
        ],
        { description: "Job category" }
      ),
      what: Type.String({
        description: "What needs to happen (specific, actionable)",
      }),
      why: Type.String({
        description: "Why it's needed and what work it blocks",
      }),
      blocks: Type.Optional(
        Type.String({
          description: "Task IDs blocked by this (comma-separated, e.g. 'T-004, T-008')",
        })
      ),
    }),
    execute: async (_toolCallId, params) => {
      const filePath = join(getLabDir(), "jobs-for-ertem.md");
      const id = getNextId(filePath, "JOB");
      const date = new Date().toISOString().slice(0, 10);

      const entry = `
### ${id}: ${params.what}
- **Priority**: ${params.priority} | **Category**: ${params.category}
- **What**: ${params.what}
- **Why**: ${params.why}
- **Blocks**: ${params.blocks || "none"}
- **Status**: PENDING
- **Added**: ${date}
- **Notes**:
`;

      const content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
      writeFileSync(filePath, content + entry);

      return {
        content: [
          { type: "text" as const, text: `Job ${id} created for Ertem.` },
        ],
        details: {},
      };
    },
  });
}
