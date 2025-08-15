import { z } from 'zod';

// Enums for letter status and departments
export const letterStatusEnum = z.enum(['Diterima', 'Diproses', 'Selesai', 'Ditolak']);
export const departmentEnum = z.enum(['Bidang Mutasi', 'Bidang Kepegawaian', 'Bidang Pengembangan', 'Bidang Administrasi']);

// Admin schema
export const adminSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Admin = z.infer<typeof adminSchema>;

// Incoming mail schema
export const incomingMailSchema = z.object({
  id: z.number(),
  registration_number: z.string(),
  sender_name: z.string(),
  opd_name: z.string(),
  letter_number: z.string(),
  letter_subject: z.string(),
  receiver_name: z.string(),
  incoming_date: z.coerce.date(),
  status: letterStatusEnum,
  department: departmentEnum,
  update_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type IncomingMail = z.infer<typeof incomingMailSchema>;

// Input schemas for creating incoming mail
export const createIncomingMailInputSchema = z.object({
  registration_number: z.string().min(1),
  sender_name: z.string().min(1),
  opd_name: z.string().min(1),
  letter_number: z.string().min(1),
  letter_subject: z.string().min(1),
  receiver_name: z.string().min(1),
  incoming_date: z.coerce.date(),
  status: letterStatusEnum,
  department: departmentEnum,
  update_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateIncomingMailInput = z.infer<typeof createIncomingMailInputSchema>;

// Input schema for updating incoming mail
export const updateIncomingMailInputSchema = z.object({
  id: z.number(),
  registration_number: z.string().min(1).optional(),
  sender_name: z.string().min(1).optional(),
  opd_name: z.string().min(1).optional(),
  letter_number: z.string().min(1).optional(),
  letter_subject: z.string().min(1).optional(),
  receiver_name: z.string().min(1).optional(),
  incoming_date: z.coerce.date().optional(),
  status: letterStatusEnum.optional(),
  department: departmentEnum.optional(),
  update_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateIncomingMailInput = z.infer<typeof updateIncomingMailInputSchema>;

// Public tracking schema (for document status lookup)
export const trackDocumentInputSchema = z.object({
  registration_number: z.string().min(1)
});

export type TrackDocumentInput = z.infer<typeof trackDocumentInputSchema>;

// Public document status response
export const documentStatusSchema = z.object({
  registration_number: z.string(),
  last_status: letterStatusEnum,
  handling_department: departmentEnum,
  last_update_date: z.coerce.date().nullable(),
  progress_notes: z.string().nullable()
});

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

// Admin login schema
export const adminLoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

// Admin registration schema
export const registerAdminInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6)
});

export type RegisterAdminInput = z.infer<typeof registerAdminInputSchema>;

// Change password schema
export const changePasswordInputSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6)
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Dashboard statistics schema
export const dashboardStatsSchema = z.object({
  total_mails: z.number(),
  processed_mails: z.number(),
  completed_mails: z.number()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Search schema
export const searchMailsInputSchema = z.object({
  sender_name: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type SearchMailsInput = z.infer<typeof searchMailsInputSchema>;

// Delete mail input
export const deleteMailInputSchema = z.object({
  id: z.number()
});

export type DeleteMailInput = z.infer<typeof deleteMailInputSchema>;