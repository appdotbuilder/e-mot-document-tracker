import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IncomingMail } from '../schema';

export const getMailById = async (id: number): Promise<IncomingMail | null> => {
  try {
    const results = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get mail by ID failed:', error);
    throw error;
  }
};