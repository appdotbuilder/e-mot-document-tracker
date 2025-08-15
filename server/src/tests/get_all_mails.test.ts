import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type CreateIncomingMailInput } from '../schema';
import { getAllMails } from '../handlers/get_all_mails';

// Test input data for creating incoming mails
const testMail1: CreateIncomingMailInput = {
  registration_number: 'REG001/2024',
  sender_name: 'John Doe',
  opd_name: 'Dinas Pendidikan',
  letter_number: 'SPT/001/2024',
  letter_subject: 'Permohonan Data Pegawai',
  receiver_name: 'Jane Smith',
  incoming_date: new Date('2024-01-15'),
  status: 'Diterima',
  department: 'Bidang Kepegawaian',
  notes: 'Urgent request'
};

const testMail2: CreateIncomingMailInput = {
  registration_number: 'REG002/2024',
  sender_name: 'Bob Wilson',
  opd_name: 'Dinas Kesehatan',
  letter_number: 'SPT/002/2024',
  letter_subject: 'Laporan Kesehatan Pegawai',
  receiver_name: 'Alice Brown',
  incoming_date: new Date('2024-01-16'),
  status: 'Diproses',
  department: 'Bidang Administrasi',
  update_date: new Date('2024-01-17'),
  notes: 'Review in progress'
};

const testMail3: CreateIncomingMailInput = {
  registration_number: 'REG003/2024',
  sender_name: 'Carol Davis',
  opd_name: 'Dinas Perhubungan',
  letter_number: 'SPT/003/2024',
  letter_subject: 'Mutasi Pegawai',
  receiver_name: 'David Lee',
  incoming_date: new Date('2024-01-17'),
  status: 'Selesai',
  department: 'Bidang Mutasi'
};

describe('getAllMails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no mails exist', async () => {
    const result = await getAllMails();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all mails ordered by created_at descending', async () => {
    // Insert test mails with slight delay to ensure different created_at timestamps
    await db.insert(incomingMailsTable).values(testMail1).execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(incomingMailsTable).values(testMail2).execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(incomingMailsTable).values(testMail3).execute();

    const result = await getAllMails();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recently created should be first
    expect(result[0].registration_number).toEqual('REG003/2024');
    expect(result[1].registration_number).toEqual('REG002/2024');
    expect(result[2].registration_number).toEqual('REG001/2024');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return all mail fields correctly', async () => {
    await db.insert(incomingMailsTable).values(testMail1).execute();

    const result = await getAllMails();

    expect(result).toHaveLength(1);
    
    const mail = result[0];
    expect(mail.id).toBeDefined();
    expect(mail.registration_number).toEqual('REG001/2024');
    expect(mail.sender_name).toEqual('John Doe');
    expect(mail.opd_name).toEqual('Dinas Pendidikan');
    expect(mail.letter_number).toEqual('SPT/001/2024');
    expect(mail.letter_subject).toEqual('Permohonan Data Pegawai');
    expect(mail.receiver_name).toEqual('Jane Smith');
    expect(mail.incoming_date).toBeInstanceOf(Date);
    expect(mail.status).toEqual('Diterima');
    expect(mail.department).toEqual('Bidang Kepegawaian');
    expect(mail.update_date).toBeNull();
    expect(mail.notes).toEqual('Urgent request');
    expect(mail.created_at).toBeInstanceOf(Date);
    expect(mail.updated_at).toBeInstanceOf(Date);
  });

  it('should handle mails with nullable fields correctly', async () => {
    // Create mail with all optional fields as null
    const mailWithNulls: CreateIncomingMailInput = {
      registration_number: 'REG004/2024',
      sender_name: 'Test Sender',
      opd_name: 'Test OPD',
      letter_number: 'TEST/001/2024',
      letter_subject: 'Test Subject',
      receiver_name: 'Test Receiver',
      incoming_date: new Date('2024-01-18'),
      status: 'Ditolak',
      department: 'Bidang Pengembangan'
      // notes and update_date intentionally omitted (will be null)
    };

    await db.insert(incomingMailsTable).values(mailWithNulls).execute();

    const result = await getAllMails();

    expect(result).toHaveLength(1);
    
    const mail = result[0];
    expect(mail.registration_number).toEqual('REG004/2024');
    expect(mail.status).toEqual('Ditolak');
    expect(mail.department).toEqual('Bidang Pengembangan');
    expect(mail.update_date).toBeNull();
    expect(mail.notes).toBeNull();
  });

  it('should handle large number of mails efficiently', async () => {
    // Create multiple mails to test performance
    const mailsToInsert = [];
    
    for (let i = 1; i <= 50; i++) {
      mailsToInsert.push({
        registration_number: `REG${i.toString().padStart(3, '0')}/2024`,
        sender_name: `Sender ${i}`,
        opd_name: `OPD ${i}`,
        letter_number: `SPT/${i.toString().padStart(3, '0')}/2024`,
        letter_subject: `Subject ${i}`,
        receiver_name: `Receiver ${i}`,
        incoming_date: new Date(`2024-01-${(i % 28) + 1}`),
        status: ['Diterima', 'Diproses', 'Selesai', 'Ditolak'][i % 4] as any,
        department: ['Bidang Mutasi', 'Bidang Kepegawaian', 'Bidang Pengembangan', 'Bidang Administrasi'][i % 4] as any
      });
    }

    await db.insert(incomingMailsTable).values(mailsToInsert).execute();

    const result = await getAllMails();

    expect(result).toHaveLength(50);
    expect(result[0].id).toBeDefined();
    expect(result[49].id).toBeDefined();
    
    // Verify all mails have required fields
    result.forEach(mail => {
      expect(mail.registration_number).toMatch(/^REG\d{3}\/2024$/);
      expect(mail.sender_name).toMatch(/^Sender \d+$/);
      expect(mail.created_at).toBeInstanceOf(Date);
    });
  });

  it('should maintain correct data types for all fields', async () => {
    await db.insert(incomingMailsTable).values(testMail2).execute();

    const result = await getAllMails();
    const mail = result[0];

    // Verify data types
    expect(typeof mail.id).toBe('number');
    expect(typeof mail.registration_number).toBe('string');
    expect(typeof mail.sender_name).toBe('string');
    expect(typeof mail.opd_name).toBe('string');
    expect(typeof mail.letter_number).toBe('string');
    expect(typeof mail.letter_subject).toBe('string');
    expect(typeof mail.receiver_name).toBe('string');
    expect(mail.incoming_date).toBeInstanceOf(Date);
    expect(typeof mail.status).toBe('string');
    expect(typeof mail.department).toBe('string');
    expect(mail.update_date).toBeInstanceOf(Date); // testMail2 has update_date
    expect(typeof mail.notes).toBe('string');
    expect(mail.created_at).toBeInstanceOf(Date);
    expect(mail.updated_at).toBeInstanceOf(Date);
  });
});