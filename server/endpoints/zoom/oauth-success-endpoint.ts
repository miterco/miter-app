import ZoomAPI from '../../zoom/ZoomAPI';
import {updateOrCreateZoomUser} from '../../data/people/update-or-create-zoom-user';
import httpEndpoint from '../../server-core/http/http-endpoint';
import {trackAnalyticsEvent} from '../../server-core/analytics';

export const zoomOauthSuccessEndpoint = httpEndpoint(async (req, res) => {
  const zoomApi = new ZoomAPI({authCode: req.query.code as string});

  // Fetch the user account information.
  const zoomUser = await zoomApi.fetchUser('me');
  zoomUser.credentials = zoomApi.credentials;

  const {user, isNewUser} = await updateOrCreateZoomUser(zoomUser);

  trackAnalyticsEvent('Complete Zoom OAuth', user.loginEmail, {'New User': String(isNewUser)});

  res.redirect(await zoomApi.createDeepLink());
});
