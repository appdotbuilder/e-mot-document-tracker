import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminsTable } from '../db/schema';
import { seedAdminUser } from './seed_admin_user';
import { eq } from 'drizzle-orm';

describe('seedAdminUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create default admin user when no admin exists', async () => {
    const result = await seedAdminUser();

    // Should return true indicating success
    expect(result).toBe(true);

    // Verify admin was created in database
    const admins = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.username, 'admin'))
      .execute();

    expect(admins).toHaveLength(1);
    expect(admins[0].username).toEqual('admin');
    expect(admins[0].password_hash).toBeDefined();
    expect(admins[0].password_hash).not.toEqual('admin123'); // Should be hashed
    expect(admins[0].created_at).toBeInstanceOf(Date);
    expect(admins[0].updated_at).toBeInstanceOf(Date);
  });

  it('should verify password hash is correct', async () => {
    await seedAdminUser();

    // Get the created admin
    const admins = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.username, 'admin'))
      .execute();

    const admin = admins[0];

    // Verify password using Bun.password.verify
    const isPasswordValid = await Bun.password.verify('admin123', admin.password_hash);
    expect(isPasswordValid).toBe(true);

    // Verify wrong password fails
    const isWrongPasswordValid = await Bun.password.verify('wrongpassword', admin.password_hash);
    expect(isWrongPasswordValid).toBe(false);
  });

  it('should return true when admin already exists', async () => {
    // First, manually create an admin
    const existingPasswordHash = await Bun.password.hash('existingpassword');
    await db.insert(adminsTable)
      .values({
        username: 'existing_admin',
        password_hash: existingPasswordHash
      })
      .execute();

    // Now call seedAdminUser
    const result = await seedAdminUser();

    // Should return true (no action needed)
    expect(result).toBe(true);

    // Should not create another admin
    const admins = await db.select()
      .from(adminsTable)
      .execute();

    expect(admins).toHaveLength(1);
    expect(admins[0].username).toEqual('existing_admin');
  });

  it('should not create duplicate admin if called multiple times', async () => {
    // Call seedAdminUser twice
    const result1 = await seedAdminUser();
    const result2 = await seedAdminUser();

    // Both should return true
    expect(result1).toBe(true);
    expect(result2).toBe(true);

    // Should only have one admin
    const admins = await db.select()
      .from(adminsTable)
      .execute();

    expect(admins).toHaveLength(1);
    expect(admins[0].username).toEqual('admin');
  });

  it('should handle database constraints correctly', async () => {
    // First call should succeed
    const result1 = await seedAdminUser();
    expect(result1).toBe(true);

    // Verify exactly one admin exists
    const adminsCount = await db.select()
      .from(adminsTable)
      .execute();

    expect(adminsCount).toHaveLength(1);

    // Second call should also succeed (no new admin created)
    const result2 = await seedAdminUser();
    expect(result2).toBe(true);

    // Still should have exactly one admin
    const finalAdminsCount = await db.select()
      .from(adminsTable)
      .execute();

    expect(finalAdminsCount).toHaveLength(1);
  });
});