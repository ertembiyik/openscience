import type { Tool } from "./tools";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
}

export interface LLMProvider {
  complete(
    systemPrompt: string,
    messages: any[],
    tools: Tool[],
  ): Promise<LLMResponse>;
}

// --- Anthropic (Messages API) ---

export class AnthropicProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model = "claude-sonnet-4-5-20250929",
  ) {}

  async complete(systemPrompt: string, messages: any[], tools: Tool[]) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 16384,
        system: systemPrompt,
        messages,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const content =
      data.content
        ?.filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("") ?? "";
    const toolCalls =
      data.content
        ?.filter((b: any) => b.type === "tool_use")
        .map((b: any) => ({ id: b.id, name: b.name, input: b.input })) ?? [];

    return { content, toolCalls };
  }
}

// --- OpenAI (Chat Completions API) ---

export class OpenAIProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model = "gpt-4o",
  ) {}

  async complete(systemPrompt: string, messages: any[], tools: Tool[]) {
    // Convert Anthropic-style messages to OpenAI format
    const oaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: any) => this.convertMessage(m)),
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 16384,
        messages: oaiMessages,
        tools: tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";
    const toolCalls =
      choice?.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
      })) ?? [];

    return { content, toolCalls };
  }

  private convertMessage(m: any): any {
    if (m.role === "user") {
      // Could be a string or array with tool_result blocks
      if (Array.isArray(m.content)) {
        const toolResults = m.content.filter(
          (b: any) => b.type === "tool_result",
        );
        if (toolResults.length > 0) {
          // Return multiple tool messages
          return toolResults.map((tr: any) => ({
            role: "tool",
            tool_call_id: tr.tool_use_id,
            content:
              typeof tr.content === "string"
                ? tr.content
                : JSON.stringify(tr.content),
          }));
        }
        return {
          role: "user",
          content: m.content.map((b: any) => b.text ?? "").join(""),
        };
      }
      return { role: "user", content: m.content };
    }

    if (m.role === "assistant") {
      if (Array.isArray(m.content)) {
        const text = m.content
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("");
        const toolUses = m.content.filter((b: any) => b.type === "tool_use");
        if (toolUses.length > 0) {
          return {
            role: "assistant",
            content: text || null,
            tool_calls: toolUses.map((tu: any) => ({
              id: tu.id,
              type: "function",
              function: {
                name: tu.name,
                arguments: JSON.stringify(tu.input),
              },
            })),
          };
        }
        return { role: "assistant", content: text };
      }
      return { role: "assistant", content: m.content };
    }

    return m;
  }
}

// --- Google (Gemini API) ---

export class GoogleProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model = "gemini-2.0-flash",
  ) {}

  async complete(systemPrompt: string, messages: any[], tools: Tool[]) {
    const contents = messages.map((m: any) => this.convertMessage(m)).flat();

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          tools: [
            {
              function_declarations: tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const content = parts
      .filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join("");
    const toolCalls = parts
      .filter((p: any) => p.functionCall)
      .map((p: any, i: number) => ({
        id: `call_${i}_${Date.now()}`,
        name: p.functionCall.name,
        input: p.functionCall.args ?? {},
      }));

    return { content, toolCalls };
  }

  private convertMessage(m: any): any {
    if (m.role === "user") {
      if (Array.isArray(m.content)) {
        const toolResults = m.content.filter(
          (b: any) => b.type === "tool_result",
        );
        if (toolResults.length > 0) {
          return {
            role: "user",
            parts: toolResults.map((tr: any) => ({
              functionResponse: {
                name: tr.tool_name ?? "unknown",
                response: { result: tr.content },
              },
            })),
          };
        }
      }
      const text =
        typeof m.content === "string"
          ? m.content
          : m.content?.map((b: any) => b.text ?? "").join("") ?? "";
      return { role: "user", parts: [{ text }] };
    }

    if (m.role === "assistant") {
      if (Array.isArray(m.content)) {
        const parts: any[] = [];
        for (const b of m.content) {
          if (b.type === "text" && b.text) parts.push({ text: b.text });
          if (b.type === "tool_use")
            parts.push({
              functionCall: { name: b.name, args: b.input },
            });
        }
        return { role: "model", parts };
      }
      return { role: "model", parts: [{ text: m.content }] };
    }

    return { role: "user", parts: [{ text: JSON.stringify(m) }] };
  }
}

// --- Factory ---

export function createProvider(provider: string, apiKey: string): LLMProvider {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    case "google":
      return new GoogleProvider(apiKey);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
