import type { Tool } from "./tools";
import type { LLMProvider } from "./providers";
import { RESEARCH_SYSTEM_PROMPT, VERIFY_SYSTEM_PROMPT } from "./prompts";
import { createConvexTools } from "./extensions/convex-tools";
import { createLabTools } from "./extensions/lab-tools";
import type { OpenScienceClient } from "./convex";

const MAX_TURNS = 50;

/**
 * Run a task using a generic tool-use loop.
 * The agent is just an LLM with tools — no framework, no runtime dependency.
 * It claims context from Convex, reasons with the LLM, calls tools, and returns a result.
 */
export async function runTask(
  task: any,
  client: OpenScienceClient,
  provider: LLMProvider,
): Promise<string> {
  const systemPrompt =
    task.type === "RESEARCH" ? RESEARCH_SYSTEM_PROMPT : VERIFY_SYSTEM_PROMPT;

  const tools: Tool[] = [
    ...createConvexTools(client, task),
    ...createLabTools(client, task),
  ];

  const contextStr = JSON.stringify(task.context, null, 2);
  const userMessage = `Task Context:\n${contextStr}`;

  // Anthropic-style message format (providers convert internally)
  const messages: any[] = [{ role: "user", content: userMessage }];
  let lastTextContent = "";

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await provider.complete(systemPrompt, messages, tools);

    if (response.content) {
      lastTextContent = response.content;
    }

    // No tool calls — agent is done
    if (!response.toolCalls.length) {
      return response.content || lastTextContent || "Task completed (no output)";
    }

    // Record assistant message with tool calls
    const assistantContent: any[] = [];
    if (response.content) {
      assistantContent.push({ type: "text", text: response.content });
    }
    for (const tc of response.toolCalls) {
      assistantContent.push({
        type: "tool_use",
        id: tc.id,
        name: tc.name,
        input: tc.input,
      });
    }
    messages.push({ role: "assistant", content: assistantContent });

    // Execute tools
    const toolResults: any[] = [];
    for (const tc of response.toolCalls) {
      const tool = tools.find((t) => t.name === tc.name);
      let result: string;
      if (!tool) {
        result = `Unknown tool: ${tc.name}`;
      } else {
        try {
          result = await tool.execute(tc.input);
        } catch (err: any) {
          result = `Error: ${err.message}`;
        }
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: tc.id,
        tool_name: tc.name,
        content: result,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return lastTextContent || "Max turns reached";
}
