import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type IncomingMail } from '../schema';

export const getRecentMails = async (limit: number = 10): Promise<IncomingMail[]> => {
  try {
    // Query for recent mails ordered by created_at descending
    const results = await db.select()
      .from(incomingMailsTable)
      .orderBy(desc(incomingMailsTable.created_at))
      .limit(limit)
      .execute();

    // Return the results - no numeric conversions needed as all fields are text/timestamp
    return results;
  } catch (error) {
    console.error('Failed to fetch recent mails:', error);
    throw error;
  }
};