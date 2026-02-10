import type { Tool } from "../tools";
import type { OpenLabClient } from "../convex";

export function createLabTools(client: OpenLabClient, task: any): Tool[] {
  return [
    {
      name: "lab_notebook",
      description:
        "Write an entry to the lab notebook. Use this to document your reasoning process — observations, hypotheses, results, and decisions.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["OBSERVATION", "REASONING", "HYPOTHESIS", "RESULT", "DECISION"],
            description: "Type of notebook entry",
          },
          content: { type: "string", description: "Content of the entry" },
        },
        required: ["type", "content"],
      },
      execute: async (params) => {
        await client.appendLabNotebook(task._id, task.projectId, {
          type: params.type,
          content: params.content,
        });
        return `Lab notebook entry recorded (${params.type})`;
      },
    },
  ];
}
