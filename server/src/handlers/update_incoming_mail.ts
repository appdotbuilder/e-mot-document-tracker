import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type UpdateIncomingMailInput, type IncomingMail } from '../schema';
import { eq } from 'drizzle-orm';

export const updateIncomingMail = async (input: UpdateIncomingMailInput): Promise<IncomingMail | null> => {
  try {
    // First check if the mail exists
    const existingMail = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, input.id))
      .execute();

    if (existingMail.length === 0) {
      return null;
    }

    // Prepare update values - only include fields that are provided
    const updateValues: any = {
      updated_at: new Date()
    };

    // Add provided fields to update
    if (input.registration_number !== undefined) {
      updateValues.registration_number = input.registration_number;
    }
    if (input.sender_name !== undefined) {
      updateValues.sender_name = input.sender_name;
    }
    if (input.opd_name !== undefined) {
      updateValues.opd_name = input.opd_name;
    }
    if (input.letter_number !== undefined) {
      updateValues.letter_number = input.letter_number;
    }
    if (input.letter_subject !== undefined) {
      updateValues.letter_subject = input.letter_subject;
    }
    if (input.receiver_name !== undefined) {
      updateValues.receiver_name = input.receiver_name;
    }
    if (input.incoming_date !== undefined) {
      updateValues.incoming_date = input.incoming_date;
    }
    if (input.status !== undefined) {
      updateValues.status = input.status;
      // Update update_date when status changes
      updateValues.update_date = new Date();
    }
    if (input.department !== undefined) {
      updateValues.department = input.department;
    }
    if (input.update_date !== undefined) {
      updateValues.update_date = input.update_date;
    }
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update the mail record
    const result = await db.update(incomingMailsTable)
      .set(updateValues)
      .where(eq(incomingMailsTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Update incoming mail failed:', error);
    throw error;
  }
};