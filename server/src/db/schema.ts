import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums for database
export const letterStatusEnum = pgEnum('letter_status', ['Diterima', 'Diproses', 'Selesai', 'Ditolak']);
export const departmentEnum = pgEnum('department', ['Bidang Mutasi', 'Bidang Kepegawaian', 'Bidang Pengembangan', 'Bidang Administrasi']);

// Admins table
export const adminsTable = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Incoming mails table
export const incomingMailsTable = pgTable('incoming_mails', {
  id: serial('id').primaryKey(),
  registration_number: text('registration_number').notNull().unique(),
  sender_name: text('sender_name').notNull(),
  opd_name: text('opd_name').notNull(),
  letter_number: text('letter_number').notNull(),
  letter_subject: text('letter_subject').notNull(),
  receiver_name: text('receiver_name').notNull(),
  incoming_date: timestamp('incoming_date').notNull(),
  status: letterStatusEnum('status').notNull(),
  department: departmentEnum('department').notNull(),
  update_date: timestamp('update_date'), // Nullable by default
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Admin = typeof adminsTable.$inferSelect;
export type NewAdmin = typeof adminsTable.$inferInsert;

export type IncomingMail = typeof incomingMailsTable.$inferSelect;
export type NewIncomingMail = typeof incomingMailsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  admins: adminsTable,
  incomingMails: incomingMailsTable 
};