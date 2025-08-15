import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { eq, count } from 'drizzle-orm';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total count of all mails
    const totalMailsResult = await db.select({ count: count() })
      .from(incomingMailsTable)
      .execute();
    
    // Get count of processed mails (status = 'Diproses')
    const processedMailsResult = await db.select({ count: count() })
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.status, 'Diproses'))
      .execute();
    
    // Get count of completed mails (status = 'Selesai')
    const completedMailsResult = await db.select({ count: count() })
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.status, 'Selesai'))
      .execute();

    return {
      total_mails: totalMailsResult[0].count,
      processed_mails: processedMailsResult[0].count,
      completed_mails: completedMailsResult[0].count
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
};