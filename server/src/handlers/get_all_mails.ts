import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type IncomingMail } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllMails = async (): Promise<IncomingMail[]> => {
  try {
    const results = await db.select()
      .from(incomingMailsTable)
      .orderBy(desc(incomingMailsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all mails:', error);
    throw error;
  }
};