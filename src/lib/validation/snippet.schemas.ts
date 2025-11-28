import { z } from "zod";
import { SNIPPET_LANGUAGES, VALIDATION_CONSTRAINTS } from "../../types";

/**
 * Snippet creation validation schema
 * Matches CreateSnippetDto and database constraints
 */
export const createSnippetSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_CONSTRAINTS.title.min, "Title is required")
    .max(VALIDATION_CONSTRAINTS.title.max, `Title must be ${VALIDATION_CONSTRAINTS.title.max} characters or less`)
    .refine((s) => s.trim().length > 0, "Title cannot be whitespace only"),

  content: z.string().min(VALIDATION_CONSTRAINTS.content.min, "Content is required"),

  language: z.enum(SNIPPET_LANGUAGES as any, {
    errorMap: () => ({ message: "Please select a language" }),
  }),

  description: z
    .string()
    .max(VALIDATION_CONSTRAINTS.description.max, `Description must be ${VALIDATION_CONSTRAINTS.description.max} characters or less`)
    .optional()
    .nullable(),

  tags: z.array(z.string()).default([]),
});

/**
 * Snippet update validation schema
 * All fields optional (partial update)
 */
export const updateSnippetSchema = createSnippetSchema.partial();

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  query: z.string().optional(),
  language: z.enum([...SNIPPET_LANGUAGES, "All"] as any).optional(),
});
