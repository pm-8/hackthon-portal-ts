import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICommit extends Document {
  teamId: Types.ObjectId;
  commitId: string;
  repoUrl: string;
  commitMessage: string;
  committerName: string;
  committerEmail?: string;
  commitUrl?: string;
  committedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commitSchema: Schema = new Schema<ICommit>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    commitId: {
      type: String,
      required: true,
    },
    repoUrl: {
      type: String,
      required: true,
    },
    commitMessage: {
      type: String,
      required: true,
    },
    committerName: {
      type: String,
      required: true,
    },
    committerEmail: {
      type: String,
      required: false,
    },
    commitUrl: {
      type: String,
      required: false,
    },
    committedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Commit = mongoose.model<ICommit>('Commit', commitSchema);
export default Commit;