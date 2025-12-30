import mongoose, { Schema, Document } from 'mongoose';
export interface IUser extends Document {
  fullName?: string;
  email: string;
  password: string;
  githubUsername: string;
  role: 'hacker' | 'mentor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
export enum UserRole {
    HACKER = 'hacker',
    MENTOR = 'mentor',
    ADMIN = 'admin'
}
const userSchema: Schema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      unique: false,
    },
    githubUsername: {
      type: String,
      default: "",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
    },
  },
  { timestamps: true }
);
const User = mongoose.model<IUser>('User', userSchema);
export default User;