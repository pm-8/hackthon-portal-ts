import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInvite extends Document {
  teamId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const inviteSchema: Schema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverEmail: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);
inviteSchema.index({ teamId: 1, receiverEmail: 1 }, { unique: true });

export default mongoose.model<IInvite>('Invite', inviteSchema);