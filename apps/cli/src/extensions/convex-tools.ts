import type { Tool } from "../tools";
import type { OpenScienceClient } from "../convex";

export function createConvexTools(client: OpenScienceClient, task: any): Tool[] {
  const tools: Tool[] = [
    {
      name: "submit_finding",
      description:
        "Submit a research finding for verification. The finding will go through 3-of-3 independent verification before entering the knowledge base.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Clear, specific title for the finding" },
          confidence: {
            type: "string",
            enum: ["HIGH", "MEDIUM", "LOW"],
            description: "Confidence level based on evidence strength",
          },
          source: { type: "string", description: "Primary source or evidence for this finding" },
          implications: { type: "string", description: "What this finding means for the research" },
        },
        required: ["title", "confidence", "source", "implications"],
      },
      execute: async (params) => {
        await client.submitFinding(
          task.projectId,
          params.title,
          params.confidence,
          params.source,
          params.implications,
          task._id,
          task.assignedTo,
        );
        return `Finding submitted for verification: "${params.title}" (${params.confidence})`;
      },
    },
    {
      name: "record_dead_end",
      description: "Record an approach that didn't work, so future agents don't repeat it.",
      parameters: {
        type: "object",
        properties: {
          what: { type: "string", description: "What was attempted" },
          whyFailed: { type: "string", description: "Why it didn't work" },
          lesson: { type: "string", description: "What can be learned from this failure" },
        },
        required: ["what", "whyFailed", "lesson"],
      },
      execute: async (params) => {
        await client.recordDeadEnd(
          task.projectId,
          params.what,
          params.whyFailed,
          1,
          params.lesson,
          task._id,
        );
        return `Dead end recorded: "${params.what}"`;
      },
    },
    {
      name: "submit_hypothesis",
      description:
        "Submit a testable hypothesis. If valid, a new research task will be automatically created to test it.",
      parameters: {
        type: "object",
        properties: {
          statement: { type: "string", description: "Specific, testable prediction" },
          rationale: { type: "string", description: "Why you think this is worth testing" },
          testPlan: { type: "string", description: "How to test this hypothesis" },
        },
        required: ["statement", "rationale", "testPlan"],
      },
      execute: async (params) => {
        try {
          await client.submitHypothesis(
            task.projectId,
            params.statement,
            params.rationale,
            params.testPlan,
            [],
            task._id,
            task.assignedTo,
          );
          return `Hypothesis submitted and test task created: "${params.statement}"`;
        } catch (err: any) {
          return `Hypothesis rejected: ${err.message}`;
        }
      },
    },
    {
      name: "expand_finding",
      description:
        "Expand a compressed finding to see full detail (Level 2). Use this when your context contains a Level 0 or Level 1 summary and you need the full source, implications, and methodology.",
      parameters: {
        type: "object",
        properties: {
          findingId: { type: "string", description: "The finding ID to expand (e.g. F-001)" },
        },
        required: ["findingId"],
      },
      execute: async (params) => {
        const result = await client.expandFinding(task.projectId, params.findingId);
        if (!result) return `Finding ${params.findingId} not found`;
        return JSON.stringify(result, null, 2);
      },
    },
    {
      name: "update_progress",
      description: "Log a progress update for the current task.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Current status" },
          message: { type: "string", description: "Progress message" },
        },
        required: ["status", "message"],
      },
      execute: async (params) => {
        console.log(`[${task._id}] ${params.status}: ${params.message}`);
        return "Progress logged";
      },
    },
  ];

  // Only register cast_vote for VERIFY tasks
  if (task.type === "VERIFY") {
    tools.push({
      name: "cast_vote",
      description:
        "Cast a PASS or FAIL vote on the pending finding. Required for verification tasks.",
      parameters: {
        type: "object",
        properties: {
          verdict: {
            type: "string",
            enum: ["PASS", "FAIL"],
            description: "PASS if the finding is verified, FAIL if not",
          },
          notes: { type: "string", description: "Detailed reasoning for your verdict" },
        },
        required: ["verdict", "notes"],
      },
      execute: async (params) => {
        const pfDbId = task.context?.pendingFindingDbId;
        if (!pfDbId) return "Error: No pending finding associated with this task";
        await client.castVote(pfDbId, task.assignedTo, params.verdict, params.notes);
        return `Vote cast: ${params.verdict}`;
      },
    });
  }

  return tools;
}
