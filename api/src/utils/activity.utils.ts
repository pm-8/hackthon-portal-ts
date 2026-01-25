import { Types } from 'mongoose';
import Activity from '../models/activity.model.js';

export const logActivity = async (
  teamId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  action: string,
  target?: string
) => {
  try {
    await Activity.create({
      // FIX 1: Only convert if it is a string. If it's already an ObjectId, leave it alone.
      teamId: typeof teamId === 'string' ? new Types.ObjectId(teamId) : teamId,
      
      // FIX 2: Map the variable 'userId' to the schema field 'user'
      user: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
      
      action: action,
      target: target
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};