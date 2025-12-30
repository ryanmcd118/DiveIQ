import { z } from "zod";

/**
 * Validation schema for creating a user certification
 */
export const createUserCertificationSchema = z.object({
  certificationDefinitionId: z.string().min(1, "Certification definition ID is required"),
  earnedDate: z.string().optional().nullable(),
  certNumber: z.string().optional().nullable(),
  diveShop: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  instructor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
});

export type CreateUserCertificationInput = z.infer<typeof createUserCertificationSchema>;

/**
 * Validation schema for updating a user certification
 */
export const updateUserCertificationSchema = z.object({
  earnedDate: z.string().optional().nullable(),
  certNumber: z.string().optional().nullable(),
  diveShop: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  instructor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
});

export type UpdateUserCertificationInput = z.infer<typeof updateUserCertificationSchema>;

