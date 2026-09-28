import { z } from "zod";

const phoneSchema = z.object({
  label: z
    .string()
    .trim()
    .min(5, "Enter a phone number.")
    .max(30)
    .regex(/^\+?[\d\s()-]+$/, "Invalid phone number.")
    .refine((value) => {
      const length = value.replace(/\D/g, "").length;
      return length >= 7 && length <= 15;
    }, "Phone numbers must contain 7–15 digits."),
});

export const contactUpdateSchema = z.object({
  phones: z.array(phoneSchema).length(2),
  topBarEmails: z
    .array(z.string().trim().email("Enter a valid email.").max(254))
    .length(2)
    .refine(
      (emails) =>
        new Set(emails.map((email) => email.toLowerCase())).size === 2,
      "Use two different email addresses.",
    ),
});
