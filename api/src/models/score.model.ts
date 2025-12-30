import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IScore extends Document {
  teamId: Types.ObjectId;
  judgeId: Types.ObjectId;
  innovation: number;
  technicality: number;
  presentation: number; 
  total: number;        
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}
const scoreSchema: Schema = new Schema<IScore>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    innovation: { type: Number, required: true, min: 1, max: 10 },
    technicality: { type: Number, required: true, min: 1, max: 10 },
    presentation: { type: Number, required: true, min: 1, max: 10 },
    total: { type: Number, default: 0 },
    feedback: { type: String }
  },
  { timestamps: true }
);
scoreSchema.pre('save', function (this: IScore, next: any) {
  this.total = this.innovation + this.technicality + this.presentation;
  next();
});
scoreSchema.index({ teamId: 1, judgeId: 1 }, { unique: true });
const Score = mongoose.model<IScore>('Score', scoreSchema);
export default Score;