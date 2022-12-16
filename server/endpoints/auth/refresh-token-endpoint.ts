import { refreshAuthTokens } from '../../data/auth-tokens/refresh-auth-tokens';
import HttpError from '../../errors/HttpError';
import httpEndpoint from '../../server-core/http/http-endpoint';


/**
 * If the provided refresh token is valid, it generates a new pair of access/refresh tokens for the user.
 *
 * This endpoint accepts the refreshToken as a cookie or as a query parameter.
 */
export const refreshTokenEndpoint = httpEndpoint(async (request, response) => {
  const refreshToken = (request.params.refreshToken || request.cookies('refreshToken', '')) as string;
  const credentials = await refreshAuthTokens(
    refreshToken,
    request.headers['user-agent'],
    request.headers['x-forwarded-for'] as string,
  );

  if (!credentials) throw new HttpError(500, 'Failed to create a new token');

  response
    .cookie('accessToken', credentials.accessToken)
    .cookie('refreshToken', credentials.accessToken)
    .cookie('tokenExpiresAt', credentials.tokenExpiresAt)
    .json({ success: true });
});
