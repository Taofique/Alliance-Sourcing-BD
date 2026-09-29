import { z } from "zod";

export const FAQ_ID_PATTERN = /^[a-f\d]{24}$/i;

const fields = {
  question: z
    .string()
    .trim()
    .min(1, "Enter a question.")
    .max(300, "Keep the question under 300 characters."),
  answer: z
    .string()
    .trim()
    .min(1, "Enter an answer.")
    .max(2000, "Keep the answer under 2000 characters."),
  sortOrder: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
};

export const faqCreateSchema = z.object(fields).strict();
export const faqUpdateSchema = z
  .object(fields)
  .strict()
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Send at least one field.");

export const faqOrderSchema = z
  .object({
    ids: z
      .array(z.string().regex(FAQ_ID_PATTERN))
      .min(1)
      .max(200)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Each question must appear exactly once.",
      ),
  })
  .strict();
