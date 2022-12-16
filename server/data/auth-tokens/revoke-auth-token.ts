import { getPrismaClient } from '../prisma-client';

const prisma = getPrismaClient();

/**
 * Revokes an auth token by its access token.
 *
 * @param accessToken - a valid access token.
 * @returns the updated user instance.
 */
export const revokeAuthTokenByAccessToken = async (accessToken: string) => {
  if (!accessToken) throw new Error('Invalid access token');

  return await prisma.authToken.update({
    where: { accessToken },
    data: { revoked: true },
  });
};

/**
 * Revokes an auth token by its refresh token.
 *
 * @param refreshToken - a valid refresh token.
 * @returns the updated user instance.
 */
export const revokeAuthTokenByRefreshToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error('Invalid refresh token');

  return await prisma.authToken.update({
    where: { refreshToken },
    data: { revoked: true },
  });
};
