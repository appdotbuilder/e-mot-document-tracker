import { db } from '../db';
import { adminsTable } from '../db/schema';

export const seedAdminUser = async (): Promise<boolean> => {
  try {
    // Check if any admin users exist
    const existingAdmins = await db.select()
      .from(adminsTable)
      .execute();

    // If admin already exists, return true (success - no action needed)
    if (existingAdmins.length > 0) {
      return true;
    }

    // Hash the default password using Bun.password.hash
    const passwordHash = await Bun.password.hash('admin123');

    // Insert the default admin user
    const result = await db.insert(adminsTable)
      .values({
        username: 'admin',
        password_hash: passwordHash
      })
      .returning()
      .execute();

    // Return true if admin was successfully created
    return result.length > 0;
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    return false; // Return false on error
  }
};