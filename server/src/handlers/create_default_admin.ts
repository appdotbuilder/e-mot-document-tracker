import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type Admin } from '../schema';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

/**
 * Hash a password using scrypt with a random salt
 */
const hashPassword = async (password: string): Promise<string> => {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash the password with the salt
    const derivedKey = await scrypt(password, salt, 64) as Buffer;
    const hash = derivedKey.toString('hex');
    
    // Return salt:hash format
    return `${salt}:${hash}`;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw error;
  }
};

/**
 * Create default admin user if no admins exist in the database
 * This function is idempotent - it only creates the admin if none exist
 */
export const createDefaultAdmin = async (): Promise<void> => {
  try {
    // Check if any admins already exist
    const existingAdmins = await db.select()
      .from(adminsTable)
      .limit(1)
      .execute();

    if (existingAdmins.length > 0) {
      console.log('Admin users already exist. Skipping default admin creation.');
      return;
    }

    // Hash the default password
    const passwordHash = await hashPassword('admin123');

    // Create the default admin
    const result = await db.insert(adminsTable)
      .values({
        username: 'admin',
        password_hash: passwordHash
      })
      .returning()
      .execute();

    if (result.length > 0) {
      console.log('Default admin user created successfully:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('  Please change the password after first login!');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
    throw error;
  }
};