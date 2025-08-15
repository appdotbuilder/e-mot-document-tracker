import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type AdminLoginInput, type Admin } from '../schema';
import { eq } from 'drizzle-orm';

export const adminLogin = async (input: AdminLoginInput): Promise<Admin | null> => {
  try {
    // Find admin by username
    const admins = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.username, input.username))
      .execute();

    if (admins.length === 0) {
      return null; // Admin not found
    }

    const admin = admins[0];

    // Verify password using Node.js crypto.scrypt (bcrypt alternative)
    const crypto = require('crypto');
    const util = require('util');
    const scrypt = util.promisify(crypto.scrypt);

    // Parse stored hash format: salt:hash
    const [salt, storedHash] = admin.password_hash.split(':');
    
    if (!salt || !storedHash) {
      return null; // Invalid hash format
    }

    // Compute hash of provided password with stored salt
    const derivedKey = await scrypt(input.password, salt, 64) as Buffer;
    const computedHash = derivedKey.toString('hex');

    // Compare hashes using constant-time comparison
    if (crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'))) {
      return admin; // Authentication successful
    }

    return null; // Password mismatch
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
};