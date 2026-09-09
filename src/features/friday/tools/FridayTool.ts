export interface FridayTool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (input: TInput) => Promise<TOutput>;
}
