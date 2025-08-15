import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type CreateIncomingMailInput } from '../schema';
import { getMailById } from '../handlers/get_mail_by_id';

// Test input for creating incoming mail
const testMailInput: CreateIncomingMailInput = {
  registration_number: 'REG/2024/001',
  sender_name: 'John Doe',
  opd_name: 'Dinas Pendidikan',
  letter_number: 'LTR/001/2024',
  letter_subject: 'Permohonan Data Siswa',
  receiver_name: 'Jane Smith',
  incoming_date: new Date('2024-01-15'),
  status: 'Diterima',
  department: 'Bidang Administrasi',
  update_date: null,
  notes: 'Permohonan data untuk keperluan penelitian'
};

describe('getMailById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return incoming mail by ID', async () => {
    // Create test mail record
    const insertResult = await db.insert(incomingMailsTable)
      .values({
        registration_number: testMailInput.registration_number,
        sender_name: testMailInput.sender_name,
        opd_name: testMailInput.opd_name,
        letter_number: testMailInput.letter_number,
        letter_subject: testMailInput.letter_subject,
        receiver_name: testMailInput.receiver_name,
        incoming_date: testMailInput.incoming_date,
        status: testMailInput.status,
        department: testMailInput.department,
        update_date: testMailInput.update_date ?? null,
        notes: testMailInput.notes ?? null
      })
      .returning()
      .execute();

    const createdMail = insertResult[0];

    // Test the handler
    const result = await getMailById(createdMail.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMail.id);
    expect(result!.registration_number).toEqual(testMailInput.registration_number);
    expect(result!.sender_name).toEqual(testMailInput.sender_name);
    expect(result!.opd_name).toEqual(testMailInput.opd_name);
    expect(result!.letter_number).toEqual(testMailInput.letter_number);
    expect(result!.letter_subject).toEqual(testMailInput.letter_subject);
    expect(result!.receiver_name).toEqual(testMailInput.receiver_name);
    expect(result!.incoming_date).toEqual(testMailInput.incoming_date);
    expect(result!.status).toEqual(testMailInput.status);
    expect(result!.department).toEqual(testMailInput.department);
    expect(result!.update_date).toBeNull();
    expect(result!.notes).toEqual(testMailInput.notes ?? null);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent mail ID', async () => {
    const result = await getMailById(99999);

    expect(result).toBeNull();
  });

  it('should handle mail with null optional fields correctly', async () => {
    // Create mail with null optional fields
    const insertResult = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG/2024/002',
        sender_name: 'Alice Brown',
        opd_name: 'Dinas Kesehatan',
        letter_number: 'LTR/002/2024',
        letter_subject: 'Laporan Bulanan',
        receiver_name: 'Bob Wilson',
        incoming_date: new Date('2024-01-20'),
        status: 'Diproses',
        department: 'Bidang Kepegawaian',
        update_date: null,  // Explicitly null
        notes: null         // Explicitly null
      })
      .returning()
      .execute();

    const createdMail = insertResult[0];

    // Test the handler
    const result = await getMailById(createdMail.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMail.id);
    expect(result!.registration_number).toEqual('REG/2024/002');
    expect(result!.sender_name).toEqual('Alice Brown');
    expect(result!.update_date).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.status).toEqual('Diproses');
    expect(result!.department).toEqual('Bidang Kepegawaian');
  });

  it('should handle mail with non-null optional fields correctly', async () => {
    const updateDate = new Date('2024-01-25');
    
    // Create mail with non-null optional fields
    const insertResult = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG/2024/003',
        sender_name: 'Charlie Davis',
        opd_name: 'Dinas Keuangan',
        letter_number: 'LTR/003/2024',
        letter_subject: 'Pengajuan Anggaran',
        receiver_name: 'Diana Evans',
        incoming_date: new Date('2024-01-22'),
        status: 'Selesai',
        department: 'Bidang Pengembangan',
        update_date: updateDate,
        notes: 'Sudah disetujui dan diproses'
      })
      .returning()
      .execute();

    const createdMail = insertResult[0];

    // Test the handler
    const result = await getMailById(createdMail.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMail.id);
    expect(result!.registration_number).toEqual('REG/2024/003');
    expect(result!.sender_name).toEqual('Charlie Davis');
    expect(result!.update_date).toEqual(updateDate);
    expect(result!.notes).toEqual('Sudah disetujui dan diproses');
    expect(result!.status).toEqual('Selesai');
    expect(result!.department).toEqual('Bidang Pengembangan');
  });

  it('should return the correct mail when multiple mails exist', async () => {
    // Create multiple mail records
    const mail1 = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG/2024/004',
        sender_name: 'First Sender',
        opd_name: 'First OPD',
        letter_number: 'LTR/004/2024',
        letter_subject: 'First Subject',
        receiver_name: 'First Receiver',
        incoming_date: new Date('2024-01-10'),
        status: 'Diterima',
        department: 'Bidang Mutasi',
        update_date: null,
        notes: null
      })
      .returning()
      .execute();

    const mail2 = await db.insert(incomingMailsTable)
      .values({
        registration_number: 'REG/2024/005',
        sender_name: 'Second Sender',
        opd_name: 'Second OPD',
        letter_number: 'LTR/005/2024',
        letter_subject: 'Second Subject',
        receiver_name: 'Second Receiver',
        incoming_date: new Date('2024-01-11'),
        status: 'Ditolak',
        department: 'Bidang Administrasi',
        update_date: null,
        notes: 'Rejected for missing documents'
      })
      .returning()
      .execute();

    // Test retrieving the second mail
    const result = await getMailById(mail2[0].id);

    // Verify we get the correct mail
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(mail2[0].id);
    expect(result!.registration_number).toEqual('REG/2024/005');
    expect(result!.sender_name).toEqual('Second Sender');
    expect(result!.letter_subject).toEqual('Second Subject');
    expect(result!.status).toEqual('Ditolak');
    expect(result!.notes).toEqual('Rejected for missing documents');
    
    // Make sure we didn't get the first mail
    expect(result!.registration_number).not.toEqual('REG/2024/004');
    expect(result!.sender_name).not.toEqual('First Sender');
  });
});