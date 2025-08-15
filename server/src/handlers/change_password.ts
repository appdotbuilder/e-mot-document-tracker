import { db } from '../db';
import { adminsTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { eq } from 'drizzle-orm';

export const changePassword = async (adminId: number, input: ChangePasswordInput): Promise<boolean> => {
  try {
    // First, get the current admin record
    const adminResult = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.id, adminId))
      .execute();

    if (adminResult.length === 0) {
      return false; // Admin not found
    }

    const admin = adminResult[0];

    // Verify current password
    const isCurrentPasswordValid = await Bun.password.verify(input.current_password, admin.password_hash);
    
    if (!isCurrentPasswordValid) {
      return false; // Current password is incorrect
    }

    // Hash the new password
    const newPasswordHash = await Bun.password.hash(input.new_password);

    // Update the password in the database
    const updateResult = await db.update(adminsTable)
      .set({ 
        password_hash: newPasswordHash,
        updated_at: new Date()
      })
      .where(eq(adminsTable.id, adminId))
      .returning()
      .execute();

    return updateResult.length > 0;
  } catch (error) {
    console.error('Password change failed:', error);
    throw error;
  }
};