import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type CreateIncomingMailInput, type IncomingMail } from '../schema';

export const createIncomingMail = async (input: CreateIncomingMailInput): Promise<IncomingMail> => {
  try {
    // Insert incoming mail record
    const result = await db.insert(incomingMailsTable)
      .values({
        registration_number: input.registration_number,
        sender_name: input.sender_name,
        opd_name: input.opd_name,
        letter_number: input.letter_number,
        letter_subject: input.letter_subject,
        receiver_name: input.receiver_name,
        incoming_date: input.incoming_date,
        status: input.status,
        department: input.department,
        update_date: input.update_date || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Incoming mail creation failed:', error);
    throw error;
  }
};