import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

/**
 * The amount of time it takes for the token to expire once it was generated.
 */
const TokenExpirationInterval = 3600 * 1000; // 1 HOUR.

/**
 * Generates a new pair of tokens for the given user.
 *
 * @param userId - The ID of the user to generate the tokens for.
 * @param userAgent - the user agent of the client used to sign in.
 * @param ipAddress - the IP address of the user.
 *
 * @returns the new auth token record.
 */
export const createAuthToken = async (userId: string, userAgent?: string, ipAddress?: string) => {
  if (!userId) throw new Error('Invalid user ID');

  return await prisma.authToken.create({
    data: {
      tokenExpiresAt: new Date(Date.now() + TokenExpirationInterval),
      userId,
      userAgent,
      ipAddress,
    },
    include: {user: true},
  });
};
