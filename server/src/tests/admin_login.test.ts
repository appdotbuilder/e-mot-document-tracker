import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type AdminLoginInput } from '../schema';
import { adminLogin } from '../handlers/admin_login';
import { eq } from 'drizzle-orm';

// Helper function to create password hash using scrypt
const createPasswordHash = async (password: string): Promise<string> => {
  const crypto = require('crypto');
  const util = require('util');
  const scrypt = util.promisify(crypto.scrypt);
  
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  const hash = derivedKey.toString('hex');
  
  return `${salt}:${hash}`;
};

describe('adminLogin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate admin with correct credentials', async () => {
    // Create test admin with hashed password
    const password = 'testpassword123';
    const passwordHash = await createPasswordHash(password);
    
    await db.insert(adminsTable)
      .values({
        username: 'testadmin',
        password_hash: passwordHash
      })
      .execute();

    const input: AdminLoginInput = {
      username: 'testadmin',
      password: password
    };

    const result = await adminLogin(input);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('testadmin');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.password_hash).toEqual(passwordHash);
  });

  it('should return null for incorrect password', async () => {
    // Create test admin
    const correctPassword = 'correctpassword';
    const passwordHash = await createPasswordHash(correctPassword);
    
    await db.insert(adminsTable)
      .values({
        username: 'testadmin',
        password_hash: passwordHash
      })
      .execute();

    const input: AdminLoginInput = {
      username: 'testadmin',
      password: 'wrongpassword'
    };

    const result = await adminLogin(input);

    expect(result).toBeNull();
  });

  it('should return null for non-existent username', async () => {
    const input: AdminLoginInput = {
      username: 'nonexistentadmin',
      password: 'anypassword'
    };

    const result = await adminLogin(input);

    expect(result).toBeNull();
  });

  it('should return null for admin with invalid hash format', async () => {
    // Create admin with invalid hash format (no salt separator)
    await db.insert(adminsTable)
      .values({
        username: 'invalidhash',
        password_hash: 'invalidhashformat'
      })
      .execute();

    const input: AdminLoginInput = {
      username: 'invalidhash',
      password: 'anypassword'
    };

    const result = await adminLogin(input);

    expect(result).toBeNull();
  });

  it('should authenticate different admins independently', async () => {
    // Create two different admins
    const password1 = 'admin1password';
    const password2 = 'admin2password';
    const hash1 = await createPasswordHash(password1);
    const hash2 = await createPasswordHash(password2);
    
    await db.insert(adminsTable)
      .values([
        {
          username: 'admin1',
          password_hash: hash1
        },
        {
          username: 'admin2', 
          password_hash: hash2
        }
      ])
      .execute();

    // Test admin1 authentication
    const input1: AdminLoginInput = {
      username: 'admin1',
      password: password1
    };

    const result1 = await adminLogin(input1);
    expect(result1).not.toBeNull();
    expect(result1!.username).toEqual('admin1');

    // Test admin2 authentication
    const input2: AdminLoginInput = {
      username: 'admin2',
      password: password2
    };

    const result2 = await adminLogin(input2);
    expect(result2).not.toBeNull();
    expect(result2!.username).toEqual('admin2');

    // Test cross-authentication failure
    const crossInput: AdminLoginInput = {
      username: 'admin1',
      password: password2 // Wrong password for admin1
    };

    const crossResult = await adminLogin(crossInput);
    expect(crossResult).toBeNull();
  });

  it('should handle case-sensitive username correctly', async () => {
    // Create admin with specific case
    const password = 'testpassword';
    const passwordHash = await createPasswordHash(password);
    
    await db.insert(adminsTable)
      .values({
        username: 'TestAdmin',
        password_hash: passwordHash
      })
      .execute();

    // Test exact case match (should work)
    const exactInput: AdminLoginInput = {
      username: 'TestAdmin',
      password: password
    };

    const exactResult = await adminLogin(exactInput);
    expect(exactResult).not.toBeNull();
    expect(exactResult!.username).toEqual('TestAdmin');

    // Test different case (should fail)
    const wrongCaseInput: AdminLoginInput = {
      username: 'testadmin',
      password: password
    };

    const wrongCaseResult = await adminLogin(wrongCaseInput);
    expect(wrongCaseResult).toBeNull();
  });

  it('should verify database state after successful login', async () => {
    // Create test admin
    const password = 'verifypassword';
    const passwordHash = await createPasswordHash(password);
    
    await db.insert(adminsTable)
      .values({
        username: 'verifyuser',
        password_hash: passwordHash
      })
      .execute();

    const input: AdminLoginInput = {
      username: 'verifyuser',
      password: password
    };

    const result = await adminLogin(input);

    // Verify the returned admin matches database record
    const dbAdmins = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.username, 'verifyuser'))
      .execute();

    expect(dbAdmins).toHaveLength(1);
    expect(result!.id).toEqual(dbAdmins[0].id);
    expect(result!.username).toEqual(dbAdmins[0].username);
    expect(result!.password_hash).toEqual(dbAdmins[0].password_hash);
    expect(result!.created_at).toEqual(dbAdmins[0].created_at);
    expect(result!.updated_at).toEqual(dbAdmins[0].updated_at);
  });
});