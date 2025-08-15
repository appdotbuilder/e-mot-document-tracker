import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type SearchMailsInput, type IncomingMail } from '../schema';
import { ilike } from 'drizzle-orm';

export const searchMails = async (input: SearchMailsInput): Promise<IncomingMail[]> => {
  try {
    // Apply pagination - use defaults if not provided
    const limit = input.limit || 10;
    const offset = input.offset || 0;

    // Build query conditionally without reassignment
    const results = input.sender_name
      ? await db.select()
          .from(incomingMailsTable)
          .where(ilike(incomingMailsTable.sender_name, `%${input.sender_name}%`))
          .limit(limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(incomingMailsTable)
          .limit(limit)
          .offset(offset)
          .execute();

    return results;
  } catch (error) {
    console.error('Search mails failed:', error);
    throw error;
  }
};