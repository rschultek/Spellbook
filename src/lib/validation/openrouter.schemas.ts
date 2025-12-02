import { z } from "zod";

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(10000),
});

/**
 * JSON Schema property schema (recursive)
 */
export const JsonSchemaPropertySchema: z.ZodType<z.ZodTypeAny> = z.lazy(() =>
  z.object({
    type: z.string(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    items: JsonSchemaPropertySchema.optional(),
    properties: z.record(JsonSchemaPropertySchema).optional(),
    required: z.array(z.string()).optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    additionalProperties: z.boolean().optional(),
  })
);

/**
 * JSON Schema definition
 */
export const JsonSchemaSchema = z.object({
  type: z.literal("object"),
  properties: z.record(JsonSchemaPropertySchema),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
});

/**
 * Response format schema
 */
export const ResponseFormatSchema = z.object({
  type: z.literal("json_schema"),
  json_schema: z.object({
    name: z.string(),
    strict: z.literal(true),
    schema: JsonSchemaSchema,
  }),
});

/**
 * Chat request schema
 */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional(),
  responseFormat: ResponseFormatSchema.optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
});
