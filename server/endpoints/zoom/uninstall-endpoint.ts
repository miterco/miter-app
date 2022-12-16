import {ValidationError} from 'miter-common/SharedTypes';
import {fetchUserByZoomId} from '../../data/people/fetch-user';
import {setUserZoomCredentials} from '../../data/people/set-user-zoom-credentials';
import {trackAnalyticsEvent} from '../../server-core/analytics';
import httpEndpoint from '../../server-core/http/http-endpoint';

const validateBody = (body: Record<string, any>): void => {
  if (!body.payload) throw new ValidationError('Missing payload');
  if (!body.payload.user_id) throw new ValidationError('No Zoom user ID present in the request body');
};

export const zoomUninstallEndpoint = httpEndpoint(async (req, res) => {
  validateBody(req.body);

  // Delete the zoom credentials for this user.
  const zoomUser = await fetchUserByZoomId(req.body.payload.user_id);
  if (zoomUser?.id) {
    await setUserZoomCredentials(zoomUser.id, null, null);
    console.log(`Zoom App Uninstall - User: ${zoomUser.id}`);
  } else {
    console.error('Zoom App Uninstall - Could not find a user with that Zoom user ID');
  }

  res.json({success: true});

  trackAnalyticsEvent('Uninstall Zoom App', zoomUser?.loginEmail || null);
});
