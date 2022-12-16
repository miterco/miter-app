import {Response} from 'express';
import {ExtendedRequest} from '../http-server';
import {fetchOrCreateAuthToken} from '../../../data/auth-tokens/fetch-auth-token';
import {fetchGoogleIdentifiers} from '../../../data/fetch-google-identifiers';

const withHttpUser = async (request: ExtendedRequest, response: Response) => {
  const {accessToken, refreshToken} = request.cookies;
  let user;
  if (accessToken) {
    const credentials = await fetchOrCreateAuthToken(
      accessToken,
      refreshToken,
      request.headers['user-agent'],
      request.headers['x-forwarded-for'] as string
    );

    if (credentials) {
      response
        .cookie('accessToken', credentials.accessToken)
        .cookie('refreshToken', credentials.refreshToken)
        .cookie('tokenExpiresAt', credentials.tokenExpiresAt);
    }

    user = credentials?.user || null;
  }

  if (user) {
    request.user = {
      ...user,
      gcalPushChannel: undefined,
      gcalPushChannelExpiration: undefined,
      gcalResourceId: undefined,
      gcalSyncToken: undefined,
      tokens: undefined,
      zoomTokens: undefined,
    };

    if (user.serviceId) {
      request.googleIdentifiers = {
        id: user.id,
        serviceId: user.serviceId || null,
        gcalPushChannel: user.gcalPushChannel || null,
        gcalPushChannelExpiration: user.gcalPushChannelExpiration || null,
        gcalResourceId: user.gcalResourceId || null,
        gcalSyncToken: user.gcalSyncToken || null,
        tokens: (user.tokens || {}) as Record<string, any>,
      };
    }
  }
};

export default withHttpUser;
