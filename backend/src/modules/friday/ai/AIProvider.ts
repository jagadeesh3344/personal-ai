export interface ToolParameterSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface GenerateOptions {
  systemInstruction: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
}

export interface GenerateResult {
  text: string;
  toolCalls?: ToolCallRequest[];
  raw?: any;
}

export interface AIProvider {
  generate(options: GenerateOptions): Promise<GenerateResult>;
}
