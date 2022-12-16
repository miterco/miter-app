import * as gAuth from '../../google-apis/google-auth';
import * as gCalendar from '../../google-apis/google-calendar';
import httpEndpoint from '../../server-core/http/http-endpoint';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';
import {LinkedServicesResponse} from 'miter-common/SharedTypes';

export const getLinkedServicesEndpoint = httpEndpoint<LinkedServicesResponse>(
  withHttpUser,
  async ({user, googleIdentifiers}, _response) => ({
    Google: await gAuth.isValidGoogleToken(googleIdentifiers?.tokens?.id_token),
    GoogleCalendar: user?.id ? await gCalendar.isCalendarAccessEnabledForUser(user.id) : false,
    Zoom: Boolean(user?.zoomUserId),
    ChromeExtension: Boolean(user?.installedChromeExtension),
  })
);
