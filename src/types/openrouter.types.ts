/**
 * OpenRouter Service Types
 * Type definitions for OpenRouter API integration
 */

/**
 * Configuration options for OpenRouter service
 */
export interface OpenRouterServiceOptions {
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * JSON Schema property definition
 */
export interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean;
}

/**
 * JSON Schema definition
 */
export interface JsonSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Response format configuration
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}

/**
 * Chat request to OpenRouter
 */
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

/**
 * Chat response from OpenRouter
 */
export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  structuredData?: unknown;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "error";
}

/**
 * Internal OpenRouter API payload
 */
export interface OpenRouterPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: JsonSchema;
    };
  };
}

/**
 * Internal OpenRouter API response
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter" | "error";
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
