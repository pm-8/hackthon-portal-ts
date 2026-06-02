import mongoose, { Schema, Document } from 'mongoose';
export enum UserRole {
  HACKER = 'hacker',
  MENTOR = 'mentor',
  ADMIN = 'admin'
}
export interface IUser extends Document {
  fullName?: string;
  email: string;
  githubId: string;
  githubUsername: string;
  avatarUrl?: string;
  role: UserRole;
  teamId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    githubUsername: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.HACKER,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    }
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>('User', userSchema);
export default User;