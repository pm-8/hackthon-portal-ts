import mongoose, { Schema, Document, Types } from 'mongoose';
export interface ITeam extends Document {
  teamName: string;
  teamMembers: Types.ObjectId[];
  teamLeader: Types.ObjectId;
  githubRepo: string;
  githubConnected: boolean;
  githubInstallationId: number | null;
  githubRepoId: number | null;
  githubOwner: string | null;
  githubRepoName: string | null;
  githubConnectedAt: Date | null;
  commits: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
const teamSchema: Schema = new Schema<ITeam>(
  {
    teamName: {
      type: String,
      required: true,
    },

    teamMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    teamLeader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    githubRepo: {
      type: String,
      required: true,
    },

    githubConnected: {
      type: Boolean,
      default: false,
    },

    githubInstallationId: {
      type: Number,
      default: null,
    },

    githubRepoId: {
      type: Number,
      default: null,
    },

    githubOwner: {
      type: String,
      default: null,
    },

    githubRepoName: {
      type: String,
      default: null,
    },

    githubConnectedAt: {
      type: Date,
      default: null,
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