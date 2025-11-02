import { z } from "zod";

// Study Guide validation schema
export const studyGuideSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  subject: z.string()
    .trim()
    .min(1, "Subject is required")
    .max(100, "Subject must be less than 100 characters"),
  level: z.string()
    .trim()
    .min(1, "Education level is required")
    .max(50, "Education level must be less than 50 characters"),
  description: z.string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  fileUrl: z.string()
    .trim()
    .url("Invalid URL format")
    .max(2000, "URL must be less than 2000 characters"),
});

// Authentication schemas
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
  fullName: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
  role: z.enum(["admin", "student"], {
    errorMap: () => ({ message: "Invalid role" })
  }),
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters"),
  referralCode: z.string()
    .trim()
    .max(50, "Referral code must be less than 50 characters")
    .optional(),
});

// Feedback validation schema
export const feedbackSchema = z.object({
  comment: z.string()
    .trim()
    .max(1000, "Comment must be less than 1000 characters")
    .optional(),
  isHelpful: z.boolean(),
});
