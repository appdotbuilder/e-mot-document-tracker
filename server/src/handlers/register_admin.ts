import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type RegisterAdminInput, type Admin } from '../schema';
import { eq } from 'drizzle-orm';

export const registerAdmin = async (input: RegisterAdminInput): Promise<Admin | null> => {
  try {
    // Check if admin with the given username already exists
    const existingAdmins = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.username, input.username))
      .execute();

    if (existingAdmins.length > 0) {
      // Admin with this username already exists
      return null;
    }

    // Hash the password using Bun.password.hash
    const passwordHash = await Bun.password.hash(input.password);

    // Insert the new admin record
    const result = await db.insert(adminsTable)
      .values({
        username: input.username,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    // Return the newly created admin
    return result[0];
  } catch (error) {
    console.error('Admin registration failed:', error);
    throw error;
  }
};