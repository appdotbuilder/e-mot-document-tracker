import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type AdminLoginInput, type Admin } from '../schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

/**
 * Verify a password against a stored hash using scrypt (for default admin)
 */
const verifyPasswordScrypt = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    // Parse stored hash format: salt:hash
    const [salt, hash] = storedHash.split(':');
    
    if (!salt || !hash) {
      return false; // Invalid hash format
    }

    // Compute hash of provided password with stored salt
    const derivedKey = await scrypt(password, salt, 64) as Buffer;
    const computedHash = derivedKey.toString('hex');

    // Compare hashes using constant-time comparison
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

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

    // Try Bun.password verification first (for existing admins)
    try {
      const isPasswordValidBun = await Bun.password.verify(input.password, admin.password_hash);
      if (isPasswordValidBun) {
        return admin; // Authentication successful with Bun.password
      }
    } catch (error) {
      // Bun.password verification failed, try scrypt
    }

    // Try scrypt verification (for default admin or legacy)
    const isPasswordValidScrypt = await verifyPasswordScrypt(input.password, admin.password_hash);
    if (isPasswordValidScrypt) {
      return admin; // Authentication successful with scrypt
    }

    return null; // Password mismatch with both methods
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
};