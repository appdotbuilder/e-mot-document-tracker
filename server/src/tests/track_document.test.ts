import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type TrackDocumentInput } from '../schema';
import { trackDocument } from '../handlers/track_document';

// Test data for incoming mail
const testMailData = {
  registration_number: 'REG-001-2024',
  sender_name: 'John Doe',
  opd_name: 'Dinas Komunikasi',
  letter_number: 'LTR-001/2024',
  letter_subject: 'Permohonan Data',
  receiver_name: 'Admin BKD',
  incoming_date: new Date('2024-01-15'),
  status: 'Diproses' as const,
  department: 'Bidang Kepegawaian' as const,
  update_date: new Date('2024-01-16'),
  notes: 'Sedang dalam proses verifikasi'
};

const testInput: TrackDocumentInput = {
  registration_number: 'REG-001-2024'
};

describe('trackDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return document status when document exists', async () => {
    // Create test mail record
    await db.insert(incomingMailsTable)
      .values(testMailData)
      .execute();

    const result = await trackDocument(testInput);

    expect(result).not.toBeNull();
    expect(result?.registration_number).toEqual('REG-001-2024');
    expect(result?.last_status).toEqual('Diproses');
    expect(result?.handling_department).toEqual('Bidang Kepegawaian');
    expect(result?.last_update_date).toBeInstanceOf(Date);
    expect(result?.last_update_date?.toISOString()).toEqual('2024-01-16T00:00:00.000Z');
    expect(result?.progress_notes).toEqual('Sedang dalam proses verifikasi');
  });

  it('should return null when document does not exist', async () => {
    const nonExistentInput: TrackDocumentInput = {
      registration_number: 'NON-EXISTENT-REG'
    };

    const result = await trackDocument(nonExistentInput);

    expect(result).toBeNull();
  });

  it('should handle document with null update_date and notes', async () => {
    // Create mail with null optional fields
    const mailWithNulls = {
      ...testMailData,
      registration_number: 'REG-002-2024',
      update_date: null,
      notes: null
    };

    await db.insert(incomingMailsTable)
      .values(mailWithNulls)
      .execute();

    const result = await trackDocument({
      registration_number: 'REG-002-2024'
    });

    expect(result).not.toBeNull();
    expect(result?.registration_number).toEqual('REG-002-2024');
    expect(result?.last_status).toEqual('Diproses');
    expect(result?.handling_department).toEqual('Bidang Kepegawaian');
    expect(result?.last_update_date).toBeNull();
    expect(result?.progress_notes).toBeNull();
  });

  it('should return correct status for different statuses', async () => {
    // Test with completed status
    const completedMail = {
      ...testMailData,
      registration_number: 'REG-COMPLETED-2024',
      status: 'Selesai' as const,
      department: 'Bidang Mutasi' as const,
      notes: 'Dokumen telah selesai diproses'
    };

    await db.insert(incomingMailsTable)
      .values(completedMail)
      .execute();

    const result = await trackDocument({
      registration_number: 'REG-COMPLETED-2024'
    });

    expect(result).not.toBeNull();
    expect(result?.last_status).toEqual('Selesai');
    expect(result?.handling_department).toEqual('Bidang Mutasi');
    expect(result?.progress_notes).toEqual('Dokumen telah selesai diproses');
  });

  it('should handle case-sensitive registration numbers', async () => {
    await db.insert(incomingMailsTable)
      .values(testMailData)
      .execute();

    // Test with different case
    const wrongCaseResult = await trackDocument({
      registration_number: 'reg-001-2024' // lowercase
    });

    expect(wrongCaseResult).toBeNull();

    // Test with exact case
    const correctCaseResult = await trackDocument({
      registration_number: 'REG-001-2024'
    });

    expect(correctCaseResult).not.toBeNull();
  });
});