import mongoose, {
  Schema,
  Document,
} from 'mongoose';

export enum HackathonPhase {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  JUDGING = 'judging',
  FINISHED = 'finished',
}

export interface IHackathon extends Document {
  key: string;
  name: string;
  phase: HackathonPhase;
  maxTeamSize: number;

  phaseStartedAt?: Date | null;
  liveStartedAt?: Date | null;
  judgingStartedAt?: Date | null;
  finishedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const hackathonSchema =
  new Schema<IHackathon>(
    {
      key: {
        type: String,
        unique: true,
        default: 'main',
      },

      name: {
        type: String,
        required: true,
        default:
          'HackPortal Hackathon',
        trim: true,
      },

      phase: {
        type: String,
        enum: Object.values(
          HackathonPhase
        ),
        default:
          HackathonPhase.UPCOMING,
      },

      maxTeamSize: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 4,
      },

      phaseStartedAt: {
        type: Date,
        default: null,
      },

      liveStartedAt: {
        type: Date,
        default: null,
      },

      judgingStartedAt: {
        type: Date,
        default: null,
      },

      finishedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

const Hackathon =
  mongoose.model<IHackathon>(
    'Hackathon',
    hackathonSchema
  );

export default Hackathon;