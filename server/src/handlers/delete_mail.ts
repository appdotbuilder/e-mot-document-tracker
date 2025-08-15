import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type DeleteMailInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMail = async (input: DeleteMailInput): Promise<boolean> => {
  try {
    // Check if the mail exists first
    const existingMail = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, input.id))
      .execute();

    // Return false if mail not found
    if (existingMail.length === 0) {
      return false;
    }

    // Delete the mail record
    const result = await db.delete(incomingMailsTable)
      .where(eq(incomingMailsTable.id, input.id))
      .execute();

    // Return true if deletion was successful
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Mail deletion failed:', error);
    throw error;
  }
};