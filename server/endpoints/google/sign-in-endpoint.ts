import {SignInResponse, ValidationError} from 'miter-common/SharedTypes';
import * as gAuth from '../../google-apis/google-auth';
import * as gCal from '../../google-apis/google-calendar';
import httpEndpoint from '../../server-core/http/http-endpoint';
import HttpError from '../../errors/HttpError';
import {createAuthToken} from '../../data/auth-tokens/create-auth-token';
import {ProductSurface} from '@prisma/client';
import bodySchema from '../../server-core/http/middlewares/bodySchema';
import Joi from 'joi';
import {CookieOptions} from 'express';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';

/*
 * Normally this would go in SharedTypes but it's only used in client-lib, which doesn't have access to SharedTypes.
 */
interface GoogleSignInRequest {
  code: string;
  tzOffset: number;
  productSurface: ProductSurface;
}

const ProductSurfaces = Object.values(ProductSurface);

/**
 * This configuration for the cookies is needed in order to allow HTTP Cookies to be set in the iframe when it is being
 * displayed in Google Calendar.
 */
const CookieConfig: CookieOptions = {sameSite: 'none', secure: true};

/**
 * Stores the Google authentication token for the user and creates a new user if none is found.
 *
 * This endpoint is called by the welcome app after the Google authentication is done.
 */
export const googleSignInEndpoint = httpEndpoint<GoogleSignInRequest>(
  bodySchema({
    code: Joi.string().messages({'string.base': 'Google sign-in request had invalid offline-access code.'}),
    productSurface: Joi.string()
      .valid(...ProductSurfaces)
      .messages({'string.base': 'Google sign-in request had invalid product surface'}),
    tzOffset: Joi.number().messages({'number.base': 'Google sign-in request had invalid time-zone offset'}),
  }),
  withHttpUser,
  async (request, response) => {
    const {code, productSurface, tzOffset} = request.body;

    // Req body should contain both client-side access tokens and code with which to
    // retrieve "offline access" server-side tokens.
    console.log('Retrieving offline tokens and saving user.');
    const {isNewUser, user} = await gAuth.retrieveOfflineTokensAndSaveUser(code, productSurface, request.user);
    console.log(`Retrieved tokens and saved ${isNewUser ? 'new' : 'existing'} user ${user.id}.`);

    const {needInitialPull} = await gCal.establishCalendarConnectionIfNeeded(user.id);
    if (needInitialPull) await gCal.getInitialNearTermSingleEventInstances(user, tzOffset);

    const credentials = await createAuthToken(
      user.id,
      request.headers['user-agent'], // Client user agent.
      request.headers['x-forwarded-for'] as string // IP address.
    );
    if (!credentials) throw new HttpError(500, 'Failed to create auth tokens');

    const data: SignInResponse = {
      isNewUser,
      userId: user.id,
      loginEmail: user.loginEmail,
    };

    response
      .cookie('accessToken', credentials.accessToken, CookieConfig)
      .cookie('refreshToken', credentials.refreshToken, CookieConfig)
      .cookie('tokenExpiresAt', credentials.tokenExpiresAt, CookieConfig)
      .json(data);

    if (needInitialPull) await gCal.getInitialGoogleCalendarDataAndStartSync(user);
  }
);
