import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

// Test data for creating incoming mails
const testMails = [
  {
    registration_number: 'REG001',
    sender_name: 'John Doe',
    opd_name: 'Department A',
    letter_number: 'LTR001',
    letter_subject: 'Subject 1',
    receiver_name: 'Jane Smith',
    incoming_date: new Date('2024-01-15'),
    status: 'Diterima' as const,
    department: 'Bidang Mutasi' as const,
    update_date: null,
    notes: null
  },
  {
    registration_number: 'REG002',
    sender_name: 'Alice Johnson',
    opd_name: 'Department B',
    letter_number: 'LTR002',
    letter_subject: 'Subject 2',
    receiver_name: 'Bob Wilson',
    incoming_date: new Date('2024-01-16'),
    status: 'Diproses' as const,
    department: 'Bidang Kepegawaian' as const,
    update_date: new Date('2024-01-17'),
    notes: 'Processing in progress'
  },
  {
    registration_number: 'REG003',
    sender_name: 'Charlie Brown',
    opd_name: 'Department C',
    letter_number: 'LTR003',
    letter_subject: 'Subject 3',
    receiver_name: 'Diana Prince',
    incoming_date: new Date('2024-01-18'),
    status: 'Selesai' as const,
    department: 'Bidang Pengembangan' as const,
    update_date: new Date('2024-01-19'),
    notes: 'Completed successfully'
  },
  {
    registration_number: 'REG004',
    sender_name: 'Eva Green',
    opd_name: 'Department D',
    letter_number: 'LTR004',
    letter_subject: 'Subject 4',
    receiver_name: 'Frank Castle',
    incoming_date: new Date('2024-01-20'),
    status: 'Diproses' as const,
    department: 'Bidang Administrasi' as const,
    update_date: new Date('2024-01-21'),
    notes: 'Under review'
  },
  {
    registration_number: 'REG005',
    sender_name: 'Grace Hopper',
    opd_name: 'Department E',
    letter_number: 'LTR005',
    letter_subject: 'Subject 5',
    receiver_name: 'Henry Ford',
    incoming_date: new Date('2024-01-22'),
    status: 'Selesai' as const,
    department: 'Bidang Mutasi' as const,
    update_date: new Date('2024-01-23'),
    notes: 'All requirements met'
  },
  {
    registration_number: 'REG006',
    sender_name: 'Isaac Newton',
    opd_name: 'Department F',
    letter_number: 'LTR006',
    letter_subject: 'Subject 6',
    receiver_name: 'Julia Roberts',
    incoming_date: new Date('2024-01-24'),
    status: 'Ditolak' as const,
    department: 'Bidang Kepegawaian' as const,
    update_date: new Date('2024-01-25'),
    notes: 'Rejected due to incomplete documents'
  }
];

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats for empty database', async () => {
    const result = await getDashboardStats();

    expect(result.total_mails).toEqual(0);
    expect(result.processed_mails).toEqual(0);
    expect(result.completed_mails).toEqual(0);
  });

  it('should calculate correct stats with mixed status mails', async () => {
    // Insert test mails
    await db.insert(incomingMailsTable)
      .values(testMails)
      .execute();

    const result = await getDashboardStats();

    // Verify counts based on test data:
    // Total: 6 mails
    // Diproses: REG002, REG004 = 2 mails
    // Selesai: REG003, REG005 = 2 mails
    expect(result.total_mails).toEqual(6);
    expect(result.processed_mails).toEqual(2);
    expect(result.completed_mails).toEqual(2);
  });

  it('should return correct stats when all mails have same status', async () => {
    // Insert only 'Diproses' status mails
    const processedMails = testMails.slice(0, 3).map(mail => ({
      ...mail,
      status: 'Diproses' as const,
      registration_number: `PROC${mail.registration_number}`
    }));

    await db.insert(incomingMailsTable)
      .values(processedMails)
      .execute();

    const result = await getDashboardStats();

    expect(result.total_mails).toEqual(3);
    expect(result.processed_mails).toEqual(3);
    expect(result.completed_mails).toEqual(0);
  });

  it('should handle single mail correctly', async () => {
    // Insert single completed mail
    await db.insert(incomingMailsTable)
      .values([{
        ...testMails[0],
        status: 'Selesai' as const
      }])
      .execute();

    const result = await getDashboardStats();

    expect(result.total_mails).toEqual(1);
    expect(result.processed_mails).toEqual(0);
    expect(result.completed_mails).toEqual(1);
  });

  it('should exclude other statuses from processed and completed counts', async () => {
    // Insert mails with 'Diterima' and 'Ditolak' statuses
    const otherStatusMails = [
      { ...testMails[0], status: 'Diterima' as const, registration_number: 'RECV001' },
      { ...testMails[1], status: 'Ditolak' as const, registration_number: 'REJECT001' },
      { ...testMails[2], status: 'Diproses' as const, registration_number: 'PROC001' },
      { ...testMails[3], status: 'Selesai' as const, registration_number: 'COMP001' }
    ];

    await db.insert(incomingMailsTable)
      .values(otherStatusMails)
      .execute();

    const result = await getDashboardStats();

    expect(result.total_mails).toEqual(4);
    expect(result.processed_mails).toEqual(1); // Only 'Diproses'
    expect(result.completed_mails).toEqual(1); // Only 'Selesai'
  });

  it('should handle large dataset correctly', async () => {
    // Create larger dataset for performance testing
    const largeMails = [];
    for (let i = 1; i <= 50; i++) {
      const statuses = ['Diterima', 'Diproses', 'Selesai', 'Ditolak'] as const;
      const status = statuses[i % 4]; // Cycle through statuses
      
      largeMails.push({
        registration_number: `LARGE${i.toString().padStart(3, '0')}`,
        sender_name: `Sender ${i}`,
        opd_name: `OPD ${i}`,
        letter_number: `LTR${i}`,
        letter_subject: `Subject ${i}`,
        receiver_name: `Receiver ${i}`,
        incoming_date: new Date(`2024-01-${(i % 28) + 1}`),
        status: status,
        department: 'Bidang Mutasi' as const,
        update_date: null,
        notes: null
      });
    }

    await db.insert(incomingMailsTable)
      .values(largeMails)
      .execute();

    const result = await getDashboardStats();

    expect(result.total_mails).toEqual(50);
    // With cycling pattern: 12 or 13 of each status
    expect(result.processed_mails).toBeGreaterThanOrEqual(12);
    expect(result.processed_mails).toBeLessThanOrEqual(13);
    expect(result.completed_mails).toBeGreaterThanOrEqual(12);
    expect(result.completed_mails).toBeLessThanOrEqual(13);
  });
});