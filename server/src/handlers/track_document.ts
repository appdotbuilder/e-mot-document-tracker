import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type TrackDocumentInput, type DocumentStatus } from '../schema';

export const trackDocument = async (input: TrackDocumentInput): Promise<DocumentStatus | null> => {
  try {
    // Query incoming mails table for the document by registration number
    const results = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.registration_number, input.registration_number))
      .execute();

    // Return null if document not found
    if (results.length === 0) {
      return null;
    }

    const mail = results[0];

    // Return document status information for public tracking
    return {
      registration_number: mail.registration_number,
      last_status: mail.status,
      handling_department: mail.department,
      last_update_date: mail.update_date,
      progress_notes: mail.notes
    };
  } catch (error) {
    console.error('Document tracking failed:', error);
    throw error;
  }
};