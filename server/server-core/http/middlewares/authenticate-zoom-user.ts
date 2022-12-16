import {NextFunction, Request, Response} from 'express';
import ZoomAPI from '../../../zoom/ZoomAPI';
import {createAuthToken} from '../../../data/auth-tokens/create-auth-token';
import {fetchUserByZoomId} from '../../../data/people/fetch-user';

const {DEBUG} = process.env;

/**
 * If the X-Zoom-App-Context header is present, it deciphers the header and sets the Zoom user and meeting IDs in
 * cookies.
 */
const authenticateZoomUser = async (request: Request, response: Response, next: NextFunction) => {
  if ('x-zoom-app-context' in request.headers) {
    try {
      const {accessToken} = request.cookies;
      const {mid, uid} = ZoomAPI.decodeContext(request.headers['x-zoom-app-context'] as string);
      if (mid) response.cookie('ZoomMeetingUID', mid);

      // Fetch the user record that was created for this Zoom account when the Zoom app was installed. The user creation
      // takes place in zoomOauthSuccessEndpoint.
      const user = await fetchUserByZoomId(uid);
      if (!user) {
        // Somehow the Zoom app tried to load in a Zoom account that didn't have a corresponding Miter user. This may
        // mean a couple of things: Zoom sent an invalid `uid` or there's a bug in zoomOauthSuccessEndpoint.
        throw new Error('Zoom app tried to load Miter without an authenticated user');
      }

      if (!accessToken) {
        // This is the first request to load the Zoom App. Generate the new credentials for the user.
        const authToken = await createAuthToken(
          user.id,
          request.headers['user-agent'],
          request.headers['x-forwarded-for'] as string
        );

        if (!authToken) throw new Error('Failed to create user credentials');

        response
          .cookie('accessToken', authToken.accessToken)
          .cookie('refreshToken', authToken.refreshToken)
          .cookie('tokenExpiresAt', authToken.tokenExpiresAt);
      }
    } catch (error) {
      // Avoid sending cryptographic errors to the user.
      return next(DEBUG ? error : new Error('Failed to authenticate Miter with your Zoom account'));
    }
  }

  next();
};

export default authenticateZoomUser;
