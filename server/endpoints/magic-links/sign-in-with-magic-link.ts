import httpEndpoint from '../../server-core/http/http-endpoint';
import {fetchMagicLinkWithUser} from '../../data/magic-links/fetch-magic-link-with-user';
import {createAuthToken} from '../../data/auth-tokens/create-auth-token';
import HttpError from '../../errors/HttpError';
import {isRedirectAllowedHost} from 'miter-common/CommonUtil';

/**
 * Performs authentication using a magic link token.
 */
export const signInWithMagicLink = httpEndpoint(async (request, response) => {
  const {token} = request.params;
  const nextUrl = request.query.next as string;
  const redirectUrl = isRedirectAllowedHost(nextUrl) ? nextUrl : null;

  // Check if the magic link is valid.
  const magicLink = await fetchMagicLinkWithUser(token);

  if (!magicLink || magicLink.tokenExpiresAt <= new Date()) {
    throw new HttpError(404, 'The magic link is invalid or it expired');
  }

  // Generate the new credentials for the user.
  const authToken = await createAuthToken(
    magicLink.user.id,
    request.headers['user-agent'],
    request.headers['x-forwarded-for'] as string
  );

  if (!authToken) throw new HttpError(500, 'Failed to create user credentials');

  response
    .cookie('accessToken', authToken.accessToken)
    .cookie('refreshToken', authToken.refreshToken)
    .cookie('tokenExpiresAt', authToken.tokenExpiresAt);

  if (redirectUrl) response.redirect(redirectUrl);
  else return {message: 'Authenticated successfully'};
});
