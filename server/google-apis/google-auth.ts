import {OAuth2Client} from 'google-auth-library';
import {google} from 'googleapis';
import {createUser} from '../data/people/create-user';
import {fetchUserByGoogleId, fetchUserByLoginEmail} from '../data/people/fetch-user';
import {fetchGoogleIdentifiers} from '../data/fetch-google-identifiers';
import {editGoogleIdentifiers} from '../data/edit-google-identifiers';
import {UserRecord} from '../server-core/server-types';
import {ProductSurface, SignUpService} from '@prisma/client';
import {rankUsers} from '../server-core/server-util';
import {mergeUsers} from '../data/people/merge-users';
import {configureNewAnalyticsUser} from '../server-core/analytics';
import {updateUser} from '../data/people/update-user';

const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const client_id = process.env.GOOGLE_CLIENT_ID;
// As far as I can tell this needs to exist, needs to be on the same origin
// as we are, and *can't* be the full URL of the callback. So, just supplying the root.
// (It presumably also needs to be registered as an origin in the Google API console.)
// TODO automatically produce this from the host we're running on?
const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

export const getAuthClient = async (userId: string) => {
  const identifiers = await fetchGoogleIdentifiers(userId);
  if (identifiers?.tokens) {
    const authClient = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    authClient.setCredentials(identifiers.tokens);
    return authClient;
  } else {
    throw new Error("getAuthClient didn't return access tokens.");
  }
};

/**
 * Generates offline tokens for the Google account and saves them to the database.
 *
 * When saving the tokens to the database, it will try to find the right user to be updated following the next steps
 * in order:
 *  - If there is a user already linked to this Google account, that user will be updated with the zoom tokens if needed.
 *  - If there is not, and there is a loggedInUser, the Google tokens will be saved in that user record.
 *  - If there is no loggedInUser, it will try to find a user with the same email as the Google account.
 *  - If none of the above applies, it will create a new user instance.
 *
 * @param code - The code received in the Google OAuth authentication. This code is exchanged for tokens.
 * @param loggedInUser - An user instance. This usually is the Zoom user, so that the Google tokens are saved in that
 *                       DB record.
 */
export const retrieveOfflineTokensAndSaveUser = async (
  code: any,
  productSurface: ProductSurface,
  loggedInUser?: UserRecord
): Promise<{isNewUser: boolean; user: UserRecord}> => {
  try {
    if (typeof code !== 'string') {
      throw new Error('Received a non-string (falsy or otherwise) code from Google.');
    }

    const authClient = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    const tokenResponse = await authClient.getToken(code);
    const {tokens} = tokenResponse;
    if (!tokens) {
      // Not sure this is necessary
      throw new Error('Received empty offline-access tokens from Google.');
    }

    authClient.setCredentials(tokens);
    const userInfoResult = await google.oauth2('v2').userinfo.v2.me.get({auth: authClient});
    const googleUser = userInfoResult.data;

    if (googleUser.id) {
      // We have a Google ID, OK to proceed.
      let existingUser = await fetchUserByGoogleId(googleUser.id);

      if (loggedInUser && !existingUser) {
        // There is no account already linked to Google and the user already has a miter account. Use that one.
        existingUser = loggedInUser;
      } else if (loggedInUser && existingUser && loggedInUser.id !== existingUser.id) {
        // There are two accounts for this user. The one used to log in (probably a Zoom account) and another account
        // linked to Google.
        const [primaryUser, secondaryUser] = rankUsers(existingUser, loggedInUser);
        await mergeUsers(primaryUser, secondaryUser);
        existingUser = primaryUser;
      }

      if (!existingUser && googleUser.email) {
        // Fetch a Zoom user with the same email address, if any.
        existingUser = await fetchUserByLoginEmail(googleUser.email);
      }

      if (existingUser) {
        // Preexisting user. Update tokens in case any existing ones have expired.
        await editGoogleIdentifiers(existingUser.id, {tokens, serviceId: googleUser.id});

        // If the user is on the Chrome extension, register that in the DB.
        // TODO this could be combined with the above, pending a discussion of the ways in which we update the users table.
        if (productSurface === ProductSurface.ChromeExtension) {
          updateUser(existingUser.id, {installedChromeExtension: true}); // Intentionally not awaiting.
        } else if (
          productSurface === ProductSurface.WebApp &&
          googleUser.picture &&
          googleUser.picture !== existingUser.picture
        ) {
          // Update the profile picture.
          updateUser(existingUser.id, {picture: googleUser.picture}); // Intentionally not awaiting.
        }

        // We don't need to return the updated user since we updated a field that isn't included.
        return {isNewUser: false, user: existingUser};
      } else {
        // If we're here, this is a new user to us.

        // Google claims we will always have a login email but their TS types tell a different story.
        if (!googleUser.email) {
          throw new Error('Google sent Miter a user without a login email.');
        }

        const newUser = await createUser(
          {
            serviceId: googleUser.id,
            firstName: googleUser.given_name || '', // Practically speaking this never comes back null from Google
            lastName: googleUser.family_name || null, // This does come back null sometimes
            displayName: googleUser.name || '', // Practically speaking, this never comes back null from Google
            loginEmail: googleUser.email,
            picture: googleUser.picture,
            // TODO profile pic (.picture contains URL)
            zoomUserId: null,
            signUpService: SignUpService.Google,
            signUpProductSurface: productSurface,
            installedChromeExtension: productSurface === ProductSurface.ChromeExtension,
          },
          tokens
        );
        configureNewAnalyticsUser(googleUser.email, productSurface);

        return {isNewUser: true, user: newUser};
      }
    } else {
      throw new Error('Google returned a user without an ID while fetching offline tokens.');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

/*
 * Verify validity of received Google token as in https://developers.google.com/identity/sign-in/web/backend-auth
 * This serves to authenticate a user and get her ID. Returns a user ID (success) or null (fail).
 */
export const getValidGoogleUserId = async (token: string): Promise<string | null> => {
  try {
    const client = new OAuth2Client(client_id);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: client_id,
    });
    const payload = ticket.getPayload();
    return payload?.sub || null;
  } catch (err: any) {
    return null;
  }
};

export const isValidGoogleToken = async (googleToken: string) => {
  return Boolean(await getValidGoogleUserId(googleToken));
};

export const initialScope = 'profile email https://www.googleapis.com/auth/userinfo.email';
export const scope =
  'profile email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email';
