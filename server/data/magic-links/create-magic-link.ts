import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();
const MagicLinkExpirationInterval = 30 * 60 * 1000; // 30 minutes.

/**
 * Adds a new record to the magic_links table in the database.
 *
 * @param userId - The ID of the user to generate the tokens for.
 * @param timeUntilExpiration - The amount of time in miliseconds before the magic link expires.
 *
 * @returns the new magic link record.
 */
export const createMagicLink = async (userId: string, timeUntilExpiration = MagicLinkExpirationInterval) => {
  if (!userId) throw new Error('Invalid user ID');

  return await prisma.magicLink.create({
    data: {
      tokenExpiresAt: new Date(Date.now() + timeUntilExpiration),
      userId,
    },
  });
};
