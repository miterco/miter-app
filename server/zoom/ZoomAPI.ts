import axios, {Method} from 'axios';
import querystring from 'querystring';
import {setUserZoomCredentials} from '../data/people/set-user-zoom-credentials';
import {ZoomAPIConfig, ZoomAPICredentials} from '../server-core/server-types';
import {decryptZoomContext} from '../server-core/server-util';

const {ZOOM_CLIENT_ID} = process.env;
const {ZOOM_CLIENT_SECRET} = process.env;
const {ZOOM_TOKEN_REDIRECT} = process.env;

enum GrantType {
  Code = 'authorization_code',
  RefreshToken = 'refresh_token',
}

/**
 * Simple abstraction for consuming the Zoom API v2.
 */
class ZoomAPI {
  private creds: ZoomAPICredentials = {};
  private userId: string = '';
  private authCode: string = '';

  constructor({credentials, userId, authCode}: ZoomAPIConfig) {
    this.creds = credentials || {};
    this.userId = userId || '';
    this.authCode = authCode || '';
  }

  // Getters.
  get credentials() {
    return this.creds;
  }

  /**
   * Decodes the Zoom context header and returns an object.
   *
   * @returns the decoded context object.
   */
  static decodeContext(header: string) {
    if (!ZOOM_CLIENT_SECRET) throw new Error('Missing ZOOM_CLIENT_SECRET in .env file');
    if (!header) throw new Error('Failed to load Miter Zoom App outside of Zoom');
    if (typeof header !== 'string') throw new Error('Invalid X-Zoom-App-Context header');

    return decryptZoomContext(header, ZOOM_CLIENT_SECRET) || {};
  }

  /**
   * Ensures that there are valid credentials for consuming the API.
   *
   * This method also checks for the required environment variables for requesting the Zoom API.
   * @returns the Zoom credentials object.  */
  async ensureCredentials() {
    if (!ZOOM_CLIENT_SECRET) throw new Error('Missing ZOOM_CLIENT_SECRET in .env file');
    if (!ZOOM_CLIENT_ID) throw new Error('Missing ZOOM_CLIENT_ID in .env file');
    if (!ZOOM_TOKEN_REDIRECT) throw new Error('Missing ZOOM_TOKEN_REDIRECT in .env file');

    if (!this.creds.access_token && this.authCode) {
      // There are no tokens, just the access code. The user is just signing up.
      await this.fetchOAuthTokens(GrantType.Code, this.authCode); // Exchange the code for tokens.
    } else if ((!this.creds.expiration || this.creds.expiration < Date.now()) && this.creds.refresh_token) {
      // There are credentials but they are expired.
      await this.fetchOAuthTokens(GrantType.RefreshToken, this.creds.refresh_token); // Uses the refres token to get new ones.
    }
  }

  /**
   * Fetch the credentials required for consuming the API, using the auth code returned by the
   * Zoom OAuth flow.
   *
   * This method can be used to retrieve the initial access and refresh tokens when the user
   * just finished the OAuth flow with his Zoom account.
   *
   * @returns the Zoom credentials object.
   */
  private async fetchOAuthTokens(grantType: GrantType, code: string) {
    const authToken = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
    const codeKey = grantType === GrantType.RefreshToken ? 'refresh_token' : 'code';

    const {data: newCredentials} = await axios.request({
      method: 'POST',
      data: querystring.stringify({
        grant_type: grantType,
        redirect_uri: ZOOM_TOKEN_REDIRECT,
        [codeKey]: code,
      }),
      url: 'https://zoom.us/oauth/token',
      headers: {Authorization: `Basic ${authToken}`},
    });

    this.creds.access_token = newCredentials.access_token;
    this.creds.refresh_token = newCredentials.refresh_token;
    this.creds.expiration = Date.now() + newCredentials.expires_in * 1000;

    await this.updateUserTokens(newCredentials);
  }

  /**
   * Updates the user record in the database with the new Zoom credentials.
   *
   * @param newCredentials - The new credentials retrieved from the Zoom API.
   */
  private async updateUserTokens(newCredentials: ZoomAPICredentials) {
    if (newCredentials && this.userId) {
      await setUserZoomCredentials(
        this.userId,
        undefined, // Don't update the Zoom user ID.
        newCredentials
      );
    }
  }

  /**
   * Refreshes the Zoom access token, using the existing refresh token.
   *
   * @returns the Zoom credentials object.
   */
  async refreshToken(): Promise<ZoomAPICredentials> {
    return this.creds;
  }

  async request(method: Method, path: string, data: Record<string, any> = {}) {
    const response = await axios.request({
      method,
      url: `https://api.zoom.us/v2${path}`,
      data,
      headers: {Authorization: `Bearer ${this.creds.access_token}`},
    });

    return response.data;
  }

  /**
   * Fetch a Zoom user by its ID.
   *
   * Instead of passing the ID, the 'me' value can be passed to get the currently logged in user.
   *
   * Requires user:read scope.
   *
   * @param userId - the Zoom ID for the requested user.
   * @returns the user data.
   */
  async fetchUser(userId: string) {
    await this.ensureCredentials();
    return await this.request('GET', `/users/${userId}`);
  }

  /**
   * Fetch a Zoom Meeting by its numeric ID.
   *
   * Requires meeting:read scope.
   *
   * @param meetingId - the numeric meeting ID from zoom.
   * @returns the meeting data.
   */
  async fetchMeeting(meetingId: string) {
    await this.ensureCredentials();
    return await this.request('GET', `/meetings/${meetingId}`);
  }

  /**
   * Generate a deep link to the Zoom App.
   *
   * A deep link is a link with the following zapp://[link-data] that, when clicked, opens the
   * Zoom App.
   */
  async createDeepLink() {
    await this.ensureCredentials();

    const data = await this.request('POST', '/zoomapp/deeplink', {action: 'go'});

    return data.deeplink;
  }
}

export default ZoomAPI;
