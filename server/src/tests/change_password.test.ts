import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { changePassword } from '../handlers/change_password';
import { eq } from 'drizzle-orm';

// Test admin data
const testAdminData = {
  username: 'testadmin',
  password_hash: '', // Will be set in beforeEach
};

const testInput: ChangePasswordInput = {
  current_password: 'oldpassword123',
  new_password: 'newpassword456'
};

describe('changePassword', () => {
  let adminId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test admin with hashed password
    const hashedPassword = await Bun.password.hash(testInput.current_password);
    const result = await db.insert(adminsTable)
      .values({
        username: testAdminData.username,
        password_hash: hashedPassword
      })
      .returning()
      .execute();
    
    adminId = result[0].id;
  });

  afterEach(resetDB);

  it('should change password when current password is correct', async () => {
    const result = await changePassword(adminId, testInput);

    expect(result).toBe(true);

    // Verify the password was actually changed in the database
    const updatedAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    expect(updatedAdmin).toHaveLength(1);
    
    // Verify old password no longer works
    const oldPasswordValid = await Bun.password.verify(testInput.current_password, updatedAdmin[0].password_hash);
    expect(oldPasswordValid).toBe(false);
    
    // Verify new password works
    const newPasswordValid = await Bun.password.verify(testInput.new_password, updatedAdmin[0].password_hash);
    expect(newPasswordValid).toBe(true);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();
    
    const originalUpdatedAt = originalAdmin[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    await changePassword(adminId, testInput);

    // Get updated timestamp
    const updatedAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    expect(updatedAdmin[0].updated_at).not.toEqual(originalUpdatedAt);
    expect(updatedAdmin[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return false when current password is incorrect', async () => {
    const wrongPasswordInput: ChangePasswordInput = {
      current_password: 'wrongpassword',
      new_password: 'newpassword456'
    };

    const result = await changePassword(adminId, wrongPasswordInput);

    expect(result).toBe(false);

    // Verify password was not changed
    const admin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    const oldPasswordStillValid = await Bun.password.verify(testInput.current_password, admin[0].password_hash);
    expect(oldPasswordStillValid).toBe(true);
  });

  it('should return false when admin does not exist', async () => {
    const nonExistentAdminId = 99999;
    
    const result = await changePassword(nonExistentAdminId, testInput);

    expect(result).toBe(false);
  });

  it('should handle password with special characters', async () => {
    const specialPasswordInput: ChangePasswordInput = {
      current_password: testInput.current_password,
      new_password: 'P@ssw0rd!@#$%^&*()'
    };

    const result = await changePassword(adminId, specialPasswordInput);

    expect(result).toBe(true);

    // Verify new password with special characters works
    const updatedAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    const newPasswordValid = await Bun.password.verify(specialPasswordInput.new_password, updatedAdmin[0].password_hash);
    expect(newPasswordValid).toBe(true);
  });

  it('should handle minimum length password', async () => {
    const minLengthInput: ChangePasswordInput = {
      current_password: testInput.current_password,
      new_password: '123456' // Minimum 6 characters as per schema
    };

    const result = await changePassword(adminId, minLengthInput);

    expect(result).toBe(true);

    // Verify new password works
    const updatedAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    const newPasswordValid = await Bun.password.verify(minLengthInput.new_password, updatedAdmin[0].password_hash);
    expect(newPasswordValid).toBe(true);
  });

  it('should preserve other admin fields during password change', async () => {
    // Get original admin data
    const originalAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    await changePassword(adminId, testInput);

    // Get updated admin data
    const updatedAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    // Verify other fields remain unchanged
    expect(updatedAdmin[0].id).toEqual(originalAdmin[0].id);
    expect(updatedAdmin[0].username).toEqual(originalAdmin[0].username);
    expect(updatedAdmin[0].created_at).toEqual(originalAdmin[0].created_at);
    
    // Only password_hash and updated_at should change
    expect(updatedAdmin[0].password_hash).not.toEqual(originalAdmin[0].password_hash);
    expect(updatedAdmin[0].updated_at).not.toEqual(originalAdmin[0].updated_at);
  });
});