import httpEndpoint from '../../server-core/http/http-endpoint';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';
import {createMagicLink} from '../../data/magic-links/create-magic-link';
import {MagicLinkResponse} from 'miter-common/SharedTypes';
import HttpError from '../../errors/HttpError';

const { HOST } = process.env;


/**
 * Creates a new magic link for passwordless authentication.
 */
export const createMagicLinkEndpoint = httpEndpoint<MagicLinkResponse>(withHttpUser, async (request) => {
  if (!request.user) throw new HttpError(401, 'Unauthorized');

  const magicLink = await createMagicLink(request.user.id);

  return { url: `${HOST}/api/magic-link/${magicLink.token}` };
});
