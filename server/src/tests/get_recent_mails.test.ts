import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type CreateIncomingMailInput } from '../schema';
import { getRecentMails } from '../handlers/get_recent_mails';

// Test mail data with complete required fields
const createTestMail = (overrides: Partial<CreateIncomingMailInput> = {}): CreateIncomingMailInput => ({
  registration_number: 'REG-001',
  sender_name: 'Test Sender',
  opd_name: 'Test OPD',
  letter_number: 'LTR-001',
  letter_subject: 'Test Subject',
  receiver_name: 'Test Receiver',
  incoming_date: new Date('2024-01-01'),
  status: 'Diterima',
  department: 'Bidang Mutasi',
  update_date: null,
  notes: null,
  ...overrides
});

describe('getRecentMails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no mails exist', async () => {
    const result = await getRecentMails();
    
    expect(result).toEqual([]);
  });

  it('should return recent mails ordered by created_at descending', async () => {
    // Create test mails with different timestamps
    const mail1 = createTestMail({
      registration_number: 'REG-001',
      sender_name: 'Sender 1'
    });
    
    const mail2 = createTestMail({
      registration_number: 'REG-002',
      sender_name: 'Sender 2'
    });

    const mail3 = createTestMail({
      registration_number: 'REG-003',
      sender_name: 'Sender 3'
    });

    // Insert mails one by one to ensure different created_at timestamps
    await db.insert(incomingMailsTable).values(mail1).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    
    await db.insert(incomingMailsTable).values(mail2).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    
    await db.insert(incomingMailsTable).values(mail3).execute();

    const result = await getRecentMails(5);

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at descending (most recent first)
    expect(result[0].sender_name).toEqual('Sender 3');
    expect(result[1].sender_name).toEqual('Sender 2');
    expect(result[2].sender_name).toEqual('Sender 1');
    
    // Verify all required fields are present
    result.forEach(mail => {
      expect(mail.id).toBeDefined();
      expect(mail.registration_number).toBeDefined();
      expect(mail.sender_name).toBeDefined();
      expect(mail.opd_name).toBeDefined();
      expect(mail.letter_number).toBeDefined();
      expect(mail.letter_subject).toBeDefined();
      expect(mail.receiver_name).toBeDefined();
      expect(mail.incoming_date).toBeInstanceOf(Date);
      expect(mail.status).toBeDefined();
      expect(mail.department).toBeDefined();
      expect(mail.created_at).toBeInstanceOf(Date);
      expect(mail.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should respect the limit parameter', async () => {
    // Create 5 test mails
    for (let i = 1; i <= 5; i++) {
      const mail = createTestMail({
        registration_number: `REG-${i.toString().padStart(3, '0')}`,
        sender_name: `Sender ${i}`
      });
      
      await db.insert(incomingMailsTable).values(mail).execute();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for timestamp difference
    }

    // Test limit of 3
    const result = await getRecentMails(3);
    
    expect(result).toHaveLength(3);
    
    // Should get the 3 most recent (last created)
    expect(result[0].sender_name).toEqual('Sender 5');
    expect(result[1].sender_name).toEqual('Sender 4');
    expect(result[2].sender_name).toEqual('Sender 3');
  });

  it('should use default limit of 10', async () => {
    // Create 15 test mails
    for (let i = 1; i <= 15; i++) {
      const mail = createTestMail({
        registration_number: `REG-${i.toString().padStart(3, '0')}`,
        sender_name: `Sender ${i}`
      });
      
      await db.insert(incomingMailsTable).values(mail).execute();
    }

    // Call without limit parameter (should default to 10)
    const result = await getRecentMails();
    
    expect(result).toHaveLength(10);
  });

  it('should handle different mail statuses and departments', async () => {
    const statuses = ['Diterima', 'Diproses', 'Selesai', 'Ditolak'] as const;
    const departments = [
      'Bidang Mutasi',
      'Bidang Kepegawaian', 
      'Bidang Pengembangan',
      'Bidang Administrasi'
    ] as const;

    // Create mails with different statuses and departments
    for (let i = 0; i < 4; i++) {
      const mail = createTestMail({
        registration_number: `REG-${i + 1}`,
        sender_name: `Sender ${i + 1}`,
        status: statuses[i],
        department: departments[i],
        update_date: new Date('2024-01-15'),
        notes: `Notes for mail ${i + 1}`
      });
      
      await db.insert(incomingMailsTable).values(mail).execute();
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getRecentMails();
    
    expect(result).toHaveLength(4);
    
    // Verify all different statuses and departments are handled correctly
    const resultStatuses = result.map(mail => mail.status);
    const resultDepartments = result.map(mail => mail.department);
    
    expect(resultStatuses).toContain('Ditolak'); // Last inserted should be first
    expect(resultStatuses).toContain('Selesai');
    expect(resultStatuses).toContain('Diproses');
    expect(resultStatuses).toContain('Diterima');
    
    expect(resultDepartments).toContain('Bidang Administrasi');
    expect(resultDepartments).toContain('Bidang Pengembangan');
    expect(resultDepartments).toContain('Bidang Kepegawaian');
    expect(resultDepartments).toContain('Bidang Mutasi');
  });

  it('should handle nullable fields correctly', async () => {
    const mail = createTestMail({
      registration_number: 'REG-NULLABLE',
      sender_name: 'Test Nullable',
      update_date: null,
      notes: null
    });

    await db.insert(incomingMailsTable).values(mail).execute();

    const result = await getRecentMails();
    
    expect(result).toHaveLength(1);
    expect(result[0].update_date).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].registration_number).toEqual('REG-NULLABLE');
  });
});