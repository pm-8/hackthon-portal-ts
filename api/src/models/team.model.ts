import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  teamName: string;
  teamMembers: string[]; // Changed from generic 'Array' to 'string[]' for better safety
  teamLeader: string;
  githubRepo: string;
  commits: Types.ObjectId[]; // Array of ObjectIds referencing Commit
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema: Schema = new Schema<ITeam>(
  {
    teamName: {
      type: String,
      required: true,
    },
    teamMembers: {
      type: [String], // Defining this as an array of Strings
      required: true,
    },
    teamLeader: {
      type: String,
      required: true,
    },
    githubRepo: {
      type: String,
      required: true,
      default: "",
    },
    commits: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Commit',
      },
    ],
  },
  { timestamps: true }
);

const Team = mongoose.model<ITeam>('Team', teamSchema);
export default Team;
