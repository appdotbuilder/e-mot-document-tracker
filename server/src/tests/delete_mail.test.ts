import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type DeleteMailInput, type CreateIncomingMailInput } from '../schema';
import { deleteMail } from '../handlers/delete_mail';
import { eq } from 'drizzle-orm';

// Test data for creating incoming mail
const testIncomingMail: CreateIncomingMailInput = {
  registration_number: 'REG-001',
  sender_name: 'John Doe',
  opd_name: 'Department of Testing',
  letter_number: 'LTR-001',
  letter_subject: 'Test Subject',
  receiver_name: 'Jane Smith',
  incoming_date: new Date('2023-01-15'),
  status: 'Diterima',
  department: 'Bidang Administrasi',
  update_date: null,
  notes: null
};

const testDeleteInput: DeleteMailInput = {
  id: 1
};

describe('deleteMail', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing mail and return true', async () => {
    // First create a mail record
    const insertResult = await db.insert(incomingMailsTable)
      .values({
        registration_number: testIncomingMail.registration_number,
        sender_name: testIncomingMail.sender_name,
        opd_name: testIncomingMail.opd_name,
        letter_number: testIncomingMail.letter_number,
        letter_subject: testIncomingMail.letter_subject,
        receiver_name: testIncomingMail.receiver_name,
        incoming_date: testIncomingMail.incoming_date,
        status: testIncomingMail.status,
        department: testIncomingMail.department,
        update_date: testIncomingMail.update_date,
        notes: testIncomingMail.notes
      })
      .returning()
      .execute();

    const createdMail = insertResult[0];
    
    // Delete the mail
    const result = await deleteMail({ id: createdMail.id });

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify mail no longer exists in database
    const deletedMails = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, createdMail.id))
      .execute();

    expect(deletedMails).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent mail', async () => {
    const nonExistentId = 999;
    
    const result = await deleteMail({ id: nonExistentId });

    expect(result).toBe(false);
  });

  it('should not affect other mails when deleting one', async () => {
    // Create two mail records
    const mail1Result = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG-001',
        sender_name: 'John Doe',
        opd_name: 'Department A',
        letter_number: 'LTR-001',
        letter_subject: 'Subject A',
        receiver_name: 'Jane Smith',
        incoming_date: new Date('2023-01-15'),
        status: 'Diterima',
        department: 'Bidang Administrasi',
        update_date: null,
        notes: null
      })
      .returning()
      .execute();

    const mail2Result = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG-002',
        sender_name: 'Alice Johnson',
        opd_name: 'Department B',
        letter_number: 'LTR-002',
        letter_subject: 'Subject B',
        receiver_name: 'Bob Wilson',
        incoming_date: new Date('2023-01-16'),
        status: 'Diproses',
        department: 'Bidang Mutasi',
        update_date: null,
        notes: null
      })
      .returning()
      .execute();

    const mail1 = mail1Result[0];
    const mail2 = mail2Result[0];

    // Delete first mail
    const result = await deleteMail({ id: mail1.id });
    expect(result).toBe(true);

    // Verify first mail is deleted
    const deletedMail = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, mail1.id))
      .execute();
    expect(deletedMail).toHaveLength(0);

    // Verify second mail still exists
    const remainingMail = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, mail2.id))
      .execute();
    expect(remainingMail).toHaveLength(1);
    expect(remainingMail[0].sender_name).toEqual('Alice Johnson');
  });

  it('should handle deletion of mail with different status types', async () => {
    // Create mails with different statuses
    const statusesToTest = ['Diterima', 'Diproses', 'Selesai', 'Ditolak'] as const;
    const createdMails = [];

    for (const status of statusesToTest) {
      const result = await db.insert(incomingMailsTable)
        .values({
          registration_number: `REG-${status}`,
          sender_name: `Sender for ${status}`,
          opd_name: 'Test Department',
          letter_number: `LTR-${status}`,
          letter_subject: `Subject for ${status}`,
          receiver_name: 'Test Receiver',
          incoming_date: new Date('2023-01-15'),
          status: status,
          department: 'Bidang Administrasi',
          update_date: null,
          notes: null
        })
        .returning()
        .execute();
      
      createdMails.push(result[0]);
    }

    // Delete each mail and verify
    for (const mail of createdMails) {
      const deleteResult = await deleteMail({ id: mail.id });
      expect(deleteResult).toBe(true);

      // Verify mail is deleted
      const checkResult = await db.select()
        .from(incomingMailsTable)
        .where(eq(incomingMailsTable.id, mail.id))
        .execute();
      expect(checkResult).toHaveLength(0);
    }
  });

  it('should handle deletion of mail with update_date and notes', async () => {
    // Create a mail with update_date and notes
    const mailWithDetails = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG-WITH-DETAILS',
        sender_name: 'Detailed Sender',
        opd_name: 'Detailed Department',
        letter_number: 'LTR-DETAILED',
        letter_subject: 'Detailed Subject',
        receiver_name: 'Detailed Receiver',
        incoming_date: new Date('2023-01-15'),
        status: 'Diproses',
        department: 'Bidang Kepegawaian',
        update_date: new Date('2023-01-20'),
        notes: 'Some important notes about this mail'
      })
      .returning()
      .execute();

    const createdMail = mailWithDetails[0];

    // Delete the mail
    const result = await deleteMail({ id: createdMail.id });
    expect(result).toBe(true);

    // Verify deletion
    const deletedMail = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, createdMail.id))
      .execute();
    expect(deletedMail).toHaveLength(0);
  });
});