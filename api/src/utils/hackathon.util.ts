import Hackathon, {
  type IHackathon,
} from '../models/hackathon.model.js';

export const getOrCreateHackathon =
  async (): Promise<IHackathon> => {
    const hackathon =
      await Hackathon.findOneAndUpdate(
        { key: 'main' },
        {
          $setOnInsert: {
            key: 'main',
            name:
              process.env.HACKATHON_NAME ||
              'HackPortal Hackathon',
            maxTeamSize: Number(
              process.env.HACKATHON_MAX_TEAM_SIZE || 4
            ),
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

    if (!hackathon) {
      throw new Error(
        'Failed to initialize hackathon'
      );
    }

    return hackathon;
  };