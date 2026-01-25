import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IActivity extends Document {
  teamId: Types.ObjectId;
  user: Types.ObjectId; // The person who did the action
  action: string;       // e.g., "created task", "joined team"
  target?: string;      // e.g., "Fix Login Bug" (The thing being acted on)
  createdAt: Date;
}
const activitySchema = new Schema<IActivity>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    target: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // We only need createdAt
);

export default mongoose.model<IActivity>('Activity', activitySchema);