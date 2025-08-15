import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type SearchMailsInput } from '../schema';
import { searchMails } from '../handlers/search_mails';

describe('searchMails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test data helper
  const createTestMail = async (senderName: string, overrides = {}) => {
    const testMail = {
      registration_number: `REG-${Date.now()}-${Math.random()}`,
      sender_name: senderName,
      opd_name: 'Test OPD',
      letter_number: 'LTR-001',
      letter_subject: 'Test Subject',
      receiver_name: 'Test Receiver',
      incoming_date: new Date(),
      status: 'Diterima' as const,
      department: 'Bidang Mutasi' as const,
      ...overrides
    };

    const result = await db.insert(incomingMailsTable)
      .values(testMail)
      .returning()
      .execute();

    return result[0];
  };

  it('should return empty array when no mails exist', async () => {
    const input: SearchMailsInput = {
      sender_name: 'NonExistent'
    };

    const result = await searchMails(input);

    expect(result).toEqual([]);
  });

  it('should search by sender name (case-insensitive)', async () => {
    // Create test mails
    await createTestMail('John Doe');
    await createTestMail('Jane Smith');
    await createTestMail('john williams');

    const input: SearchMailsInput = {
      sender_name: 'john'
    };

    const result = await searchMails(input);

    expect(result).toHaveLength(2);
    expect(result[0].sender_name.toLowerCase()).toContain('john');
    expect(result[1].sender_name.toLowerCase()).toContain('john');
  });

  it('should search with partial match', async () => {
    await createTestMail('Ahmad Budiman');
    await createTestMail('Siti Ahmad');
    await createTestMail('Budi Santoso');

    const input: SearchMailsInput = {
      sender_name: 'ahmad'
    };

    const result = await searchMails(input);

    expect(result).toHaveLength(2);
    result.forEach(mail => {
      expect(mail.sender_name.toLowerCase()).toContain('ahmad');
    });
  });

  it('should return all mails when no sender_name filter provided', async () => {
    await createTestMail('Sender One');
    await createTestMail('Sender Two');
    await createTestMail('Sender Three');

    const input: SearchMailsInput = {};

    const result = await searchMails(input);

    expect(result).toHaveLength(3);
  });

  it('should apply limit correctly', async () => {
    // Create 5 mails with similar sender names
    for (let i = 1; i <= 5; i++) {
      await createTestMail(`Test Sender ${i}`);
    }

    const input: SearchMailsInput = {
      sender_name: 'test',
      limit: 3
    };

    const result = await searchMails(input);

    expect(result).toHaveLength(3);
  });

  it('should apply offset correctly', async () => {
    // Create 5 mails with similar sender names
    for (let i = 1; i <= 5; i++) {
      await createTestMail(`Test User ${i}`);
    }

    // Get first 3 results
    const firstPage = await searchMails({
      sender_name: 'test',
      limit: 3,
      offset: 0
    });

    // Get next 2 results
    const secondPage = await searchMails({
      sender_name: 'test',
      limit: 3,
      offset: 3
    });

    expect(firstPage).toHaveLength(3);
    expect(secondPage).toHaveLength(2);

    // Ensure no overlap between pages
    const firstPageIds = firstPage.map(mail => mail.id);
    const secondPageIds = secondPage.map(mail => mail.id);
    const intersection = firstPageIds.filter(id => secondPageIds.includes(id));
    expect(intersection).toHaveLength(0);
  });

  it('should use default pagination when not provided', async () => {
    // Create 15 test mails
    for (let i = 1; i <= 15; i++) {
      await createTestMail(`Default Test ${i}`);
    }

    const input: SearchMailsInput = {
      sender_name: 'default'
    };

    const result = await searchMails(input);

    // Should return 10 results by default (limit = 10, offset = 0)
    expect(result).toHaveLength(10);
  });

  it('should combine search and pagination correctly', async () => {
    // Create mixed data
    await createTestMail('Alice Johnson');
    await createTestMail('Bob Smith');
    await createTestMail('Alice Brown');
    await createTestMail('Charlie Alice');
    await createTestMail('David Wilson');

    const input: SearchMailsInput = {
      sender_name: 'alice',
      limit: 2,
      offset: 1
    };

    const result = await searchMails(input);

    expect(result).toHaveLength(2);
    result.forEach(mail => {
      expect(mail.sender_name.toLowerCase()).toContain('alice');
    });
  });

  it('should return correct mail structure', async () => {
    const testMail = await createTestMail('Structure Test', {
      opd_name: 'Test OPD Name',
      letter_subject: 'Important Subject',
      status: 'Diproses',
      department: 'Bidang Kepegawaian'
    });

    const input: SearchMailsInput = {
      sender_name: 'structure'
    };

    const result = await searchMails(input);

    expect(result).toHaveLength(1);
    const mail = result[0];

    expect(mail.id).toBeDefined();
    expect(mail.registration_number).toBeDefined();
    expect(mail.sender_name).toEqual('Structure Test');
    expect(mail.opd_name).toEqual('Test OPD Name');
    expect(mail.letter_subject).toEqual('Important Subject');
    expect(mail.status).toEqual('Diproses');
    expect(mail.department).toEqual('Bidang Kepegawaian');
    expect(mail.created_at).toBeInstanceOf(Date);
    expect(mail.updated_at).toBeInstanceOf(Date);
  });
});