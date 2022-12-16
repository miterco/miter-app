import {AuthCheckResponse} from 'miter-common/SharedTypes';
import httpEndpoint from '../../server-core/http/http-endpoint';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';

/*
 * Use this endpoint to check whether the client is authenticated without throwing an error. Returns the same data as
 * userProfileEndpoint when the client is authenticated to avoid an extra request.
 *
 * TODO: Another way to do this without an extra file would be to allow the userProfileEndpoint to specify whether it
 * errors on authentication failure. Given it's a two-line endpoint, though...
 *
 */
export const checkAuthenticationEndpoint = httpEndpoint<AuthCheckResponse>(withHttpUser, async ({user}) => ({
  isAuthenticated: Boolean(user),
  userId: user?.id,
  loginEmail: user?.loginEmail,
}));
