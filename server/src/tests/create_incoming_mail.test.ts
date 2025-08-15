import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type CreateIncomingMailInput } from '../schema';
import { createIncomingMail } from '../handlers/create_incoming_mail';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateIncomingMailInput = {
  registration_number: 'REG-2024-001',
  sender_name: 'John Doe',
  opd_name: 'Dinas Pendidikan',
  letter_number: 'LTR-2024-001',
  letter_subject: 'Pengajuan Mutasi Guru',
  receiver_name: 'Jane Smith',
  incoming_date: new Date('2024-01-15'),
  status: 'Diterima',
  department: 'Bidang Mutasi',
  update_date: new Date('2024-01-16'),
  notes: 'Dokumen lengkap'
};

describe('createIncomingMail', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an incoming mail with all fields', async () => {
    const result = await createIncomingMail(testInput);

    // Basic field validation
    expect(result.registration_number).toEqual('REG-2024-001');
    expect(result.sender_name).toEqual('John Doe');
    expect(result.opd_name).toEqual('Dinas Pendidikan');
    expect(result.letter_number).toEqual('LTR-2024-001');
    expect(result.letter_subject).toEqual('Pengajuan Mutasi Guru');
    expect(result.receiver_name).toEqual('Jane Smith');
    expect(result.incoming_date).toEqual(testInput.incoming_date);
    expect(result.status).toEqual('Diterima');
    expect(result.department).toEqual('Bidang Mutasi');
    expect(result.update_date).toEqual(new Date('2024-01-16'));
    expect(result.notes).toEqual('Dokumen lengkap');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create incoming mail with optional fields as null', async () => {
    const inputWithoutOptionals: CreateIncomingMailInput = {
      registration_number: 'REG-2024-002',
      sender_name: 'Alice Johnson',
      opd_name: 'Dinas Kesehatan',
      letter_number: 'LTR-2024-002',
      letter_subject: 'Permintaan Data Pegawai',
      receiver_name: 'Bob Wilson',
      incoming_date: new Date('2024-01-20'),
      status: 'Diproses',
      department: 'Bidang Kepegawaian'
    };

    const result = await createIncomingMail(inputWithoutOptionals);

    expect(result.registration_number).toEqual('REG-2024-002');
    expect(result.sender_name).toEqual('Alice Johnson');
    expect(result.status).toEqual('Diproses');
    expect(result.department).toEqual('Bidang Kepegawaian');
    expect(result.update_date).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save incoming mail to database', async () => {
    const result = await createIncomingMail(testInput);

    // Query using proper drizzle syntax
    const mails = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, result.id))
      .execute();

    expect(mails).toHaveLength(1);
    expect(mails[0].registration_number).toEqual('REG-2024-001');
    expect(mails[0].sender_name).toEqual('John Doe');
    expect(mails[0].opd_name).toEqual('Dinas Pendidikan');
    expect(mails[0].letter_subject).toEqual('Pengajuan Mutasi Guru');
    expect(mails[0].status).toEqual('Diterima');
    expect(mails[0].department).toEqual('Bidang Mutasi');
    expect(mails[0].created_at).toBeInstanceOf(Date);
    expect(mails[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different status values', async () => {
    const statuses = ['Diterima', 'Diproses', 'Selesai', 'Ditolak'] as const;
    
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      const input = {
        ...testInput,
        registration_number: `REG-2024-00${i + 3}`,
        status
      };

      const result = await createIncomingMail(input);
      expect(result.status).toEqual(status);
      expect(result.registration_number).toEqual(`REG-2024-00${i + 3}`);
    }
  });

  it('should handle different department values', async () => {
    const departments = [
      'Bidang Mutasi', 
      'Bidang Kepegawaian', 
      'Bidang Pengembangan', 
      'Bidang Administrasi'
    ] as const;
    
    for (let i = 0; i < departments.length; i++) {
      const department = departments[i];
      const input = {
        ...testInput,
        registration_number: `REG-2024-01${i}`,
        department
      };

      const result = await createIncomingMail(input);
      expect(result.department).toEqual(department);
      expect(result.registration_number).toEqual(`REG-2024-01${i}`);
    }
  });

  it('should fail when registration_number is duplicated', async () => {
    // Create first mail
    await createIncomingMail(testInput);

    // Try to create another with same registration number
    await expect(createIncomingMail(testInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle dates correctly', async () => {
    const specificDate = new Date('2024-03-15T10:30:00Z');
    const updateDate = new Date('2024-03-16T14:45:00Z');
    
    const input = {
      ...testInput,
      registration_number: 'REG-2024-DATE-TEST',
      incoming_date: specificDate,
      update_date: updateDate
    };

    const result = await createIncomingMail(input);

    expect(result.incoming_date).toEqual(specificDate);
    expect(result.update_date).toEqual(updateDate);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});