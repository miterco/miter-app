import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();
const dateMultiplier = 1000 * 60 * 60 * 24;

export const fetchUsersWithExpiringPushChannels = async () => {

  if (!process.env.PUSH_CHANNEL_RENEWAL_LEAD_DAYS) throw ("Missing environment variable: PUSH_CHANNEL_RENEWAL_LEAD_DAYS");


  const expirationCutoff: Date = new Date((Date.now() + Number(process.env.PUSH_CHANNEL_RENEWAL_LEAD_DAYS) * dateMultiplier));

  const result = await prisma.user.findMany(
    {
      where:
      {
        isActive: true,
        OR: [{
          gcalPushChannelExpiration: {
            lt: expirationCutoff,
          },
        },
        {
          gcalPushChannelExpiration: null,
        }
        ],
      },
      select: {
        id: true,
      },
    });

  if (result) return result;

  return null;


};