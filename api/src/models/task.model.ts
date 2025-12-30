import mongoose, { Schema, Document, Types } from 'mongoose';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}

export interface ITask extends Document {
  teamId: Types.ObjectId;
  title: string;
  description?: string;
  assignedTo?: Types.ObjectId;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema: Schema = new Schema<ITask>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { 
      type: String, 
      enum: Object.values(TaskStatus), 
      default: TaskStatus.TODO 
    }
  },
  { timestamps: true }
);

const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task;