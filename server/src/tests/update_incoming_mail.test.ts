import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { incomingMailsTable } from '../db/schema';
import { type CreateIncomingMailInput, type UpdateIncomingMailInput } from '../schema';
import { updateIncomingMail } from '../handlers/update_incoming_mail';
import { eq } from 'drizzle-orm';

// Test data
const testMailInput: CreateIncomingMailInput = {
  registration_number: 'REG-2024-001',
  sender_name: 'John Doe',
  opd_name: 'Dinas Pendidikan',
  letter_number: 'LETTER-001',
  letter_subject: 'Pengajuan Izin',
  receiver_name: 'Jane Smith',
  incoming_date: new Date('2024-01-15'),
  status: 'Diterima',
  department: 'Bidang Administrasi',
  notes: 'Initial notes'
};

describe('updateIncomingMail', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing incoming mail', async () => {
    // Create a mail first
    const createResult = await db.insert(incomingMailsTable)
      .values({
        ...testMailInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdMail = createResult[0];

    // Update the mail
    const updateInput: UpdateIncomingMailInput = {
      id: createdMail.id,
      sender_name: 'Updated Sender',
      status: 'Diproses',
      notes: 'Updated notes'
    };

    const result = await updateIncomingMail(updateInput);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdMail.id);
    expect(result!.sender_name).toEqual('Updated Sender');
    expect(result!.status).toEqual('Diproses');
    expect(result!.notes).toEqual('Updated notes');
    
    // Verify unchanged fields remain the same
    expect(result!.registration_number).toEqual(testMailInput.registration_number);
    expect(result!.opd_name).toEqual(testMailInput.opd_name);
    expect(result!.letter_number).toEqual(testMailInput.letter_number);
    
    // Verify timestamps are updated
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.update_date).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdMail.updated_at.getTime());
  });

  it('should update status and set update_date automatically', async () => {
    // Create a mail first
    const createResult = await db.insert(incomingMailsTable)
      .values({
        ...testMailInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdMail = createResult[0];

    // Update only status
    const updateInput: UpdateIncomingMailInput = {
      id: createdMail.id,
      status: 'Selesai'
    };

    const result = await updateIncomingMail(updateInput);

    // Verify status update triggers update_date
    expect(result).toBeDefined();
    expect(result!.status).toEqual('Selesai');
    expect(result!.update_date).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    // Create a mail first
    const createResult = await db.insert(incomingMailsTable)
      .values({
        ...testMailInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdMail = createResult[0];

    // Update multiple fields
    const updateInput: UpdateIncomingMailInput = {
      id: createdMail.id,
      sender_name: 'New Sender',
      opd_name: 'New OPD',
      letter_subject: 'New Subject',
      status: 'Ditolak',
      department: 'Bidang Mutasi',
      notes: 'Rejected due to incomplete documents'
    };

    const result = await updateIncomingMail(updateInput);

    // Verify all updated fields
    expect(result).toBeDefined();
    expect(result!.sender_name).toEqual('New Sender');
    expect(result!.opd_name).toEqual('New OPD');
    expect(result!.letter_subject).toEqual('New Subject');
    expect(result!.status).toEqual('Ditolak');
    expect(result!.department).toEqual('Bidang Mutasi');
    expect(result!.notes).toEqual('Rejected due to incomplete documents');
    expect(result!.update_date).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create a mail first
    const createResult = await db.insert(incomingMailsTable)
      .values({
        ...testMailInput,
        notes: null, // Start with null notes
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdMail = createResult[0];

    // Update with null values
    const updateInput: UpdateIncomingMailInput = {
      id: createdMail.id,
      notes: null,
      update_date: null
    };

    const result = await updateIncomingMail(updateInput);

    // Verify null values are handled
    expect(result).toBeDefined();
    expect(result!.notes).toBeNull();
    expect(result!.update_date).toBeNull();
  });

  it('should return null for non-existent mail', async () => {
    const updateInput: UpdateIncomingMailInput = {
      id: 99999, // Non-existent ID
      sender_name: 'Updated Sender'
    };

    const result = await updateIncomingMail(updateInput);

    expect(result).toBeNull();
  });

  it('should save updates to database correctly', async () => {
    // Create a mail first
    const createResult = await db.insert(incomingMailsTable)
      .values({
        ...testMailInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdMail = createResult[0];

    // Update the mail
    const updateInput: UpdateIncomingMailInput = {
      id: createdMail.id,
      sender_name: 'Database Test Sender',
      status: 'Diproses'
    };

    await updateIncomingMail(updateInput);

    // Query database directly to verify update
    const updatedMail = await db.select()
      .from(incomingMailsTable)
      .where(eq(incomingMailsTable.id, createdMail.id))
      .execute();

    expect(updatedMail).toHaveLength(1);
    expect(updatedMail[0].sender_name).toEqual('Database Test Sender');
    expect(updatedMail[0].status).toEqual('Diproses');
    expect(updatedMail[0].update_date).toBeInstanceOf(Date);
    expect(updatedMail[0].updated_at.getTime()).toBeGreaterThan(createdMail.updated_at.getTime());
  });

  it('should handle partial updates without affecting other fields', async () => {
    // Create a mail first
    const createResult = await db.insert(incomingMailsTable)
      .values({
        ...testMailInput,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const createdMail = createResult[0];
    const originalUpdatedAt = createdMail.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update only notes (should not trigger update_date change)
    const updateInput: UpdateIncomingMailInput = {
      id: createdMail.id,
      notes: 'Only notes updated'
    };

    const result = await updateIncomingMail(updateInput);

    // Verify only notes and updated_at changed
    expect(result).toBeDefined();
    expect(result!.notes).toEqual('Only notes updated');
    expect(result!.status).toEqual(testMailInput.status); // Should remain unchanged
    expect(result!.sender_name).toEqual(testMailInput.sender_name); // Should remain unchanged
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    
    // update_date should not be set since status didn't change
    expect(result!.update_date).toEqual(createdMail.update_date);
  });
});