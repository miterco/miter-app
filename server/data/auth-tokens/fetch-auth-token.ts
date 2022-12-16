import {getPrismaClient} from '../prisma-client';
import {refreshAuthTokens} from './refresh-auth-tokens';

const prisma = getPrismaClient();

/**
 * Fetches the Miter user credentials by its access token.
 *
 * If the token is expired, it refreshes the token.
 *
 * @param accessToken - A valid access token.
 * @param refreshToken - The token to be used to generate new credentials.
 * @param userAgent - The User-Agent of the user's browser.
 * @param ipAddress - The IP address of the user.
 *
 * @returns the auth token record.
 */
export const fetchOrCreateAuthToken = async (
  accessToken: string,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
) => {
  if (!accessToken) throw new Error('Invalid access token');
  if (!refreshToken) throw new Error('Invalid refreshToken');

  const credentials = await prisma.authToken.findUnique({
    where: {accessToken},
    include: {user: true},
  });

  if (!credentials || credentials.revoked) return null;

  if (credentials.tokenExpiresAt < new Date() && refreshToken === credentials.refreshToken) {
    return await refreshAuthTokens(refreshToken, userAgent, ipAddress);
  }

  return credentials;
};

/**
 * Fetches the Miter user credentials by its refresh token.
 *
 * @param accessToken - A valid access token.
 *
 * @returns the auth token record.
 */
export const fetchAuthTokenByRefreshToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error('Invalid refresh token');

  const authToken = await prisma.authToken.findUnique({
    where: {refreshToken},
    include: {user: true},
  });

  return authToken?.revoked ? null : authToken;
};
