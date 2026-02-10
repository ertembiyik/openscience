/** Provider-agnostic tool definition. JSON Schema parameters, simple execute fn. */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema object
  execute: (params: any) => Promise<string>;
}
