import mongoose, { Schema, Document } from 'mongoose';

// 1. Create an interface representing a document in MongoDB.
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
// 2. Create the Schema corresponding to the document interface.
const userSchema: Schema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: false, // Explicitly set to false based on your JS code
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

// 3. Export the Model
const User = mongoose.model<IUser>('User', userSchema);
export default User;