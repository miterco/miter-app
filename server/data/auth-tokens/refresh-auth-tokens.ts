import {createAuthToken} from './create-auth-token';
import {revokeAuthTokenByRefreshToken} from './revoke-auth-token';

/**
 * Invalidates the old tokens and generates new credentials.
 *
 * @returns the new auth token record.
 */
export const refreshAuthTokens = async (refreshToken: string, userAgent?: string, ipAddress?: string) => {
  const revokedAuthToken = await revokeAuthTokenByRefreshToken(refreshToken);
  return await createAuthToken(revokedAuthToken.userId, userAgent, ipAddress);
};
