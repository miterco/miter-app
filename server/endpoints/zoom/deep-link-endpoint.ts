import ZoomAPI from '../../zoom/ZoomAPI';
import httpEndpoint from '../../server-core/http/http-endpoint';
import {fetchZoomIdentifiers} from '../../data/fetch-zoom-identifiers';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';
import HttpError from '../../errors/HttpError';

/**
 * Creates a deep link to the Zoom app and redirects the user to it.
 *
 * Deep links are just links with a special protocol. Links starting with wapp:// will be handled by the WhatsApp client
 * instead of the browser. The same way, we can generate zoomapp:// links that will be handled by the Zoom client.
 *
 * The Zoom API has an endpoint to generate this kind of link. Deep links are used to navigate from the web browser to
 * the Zoom app in the native Zoom client. Every time this endpoint is hit, if the user is authenticated, they will be
 * redirected to the Zoom app. If the Zoom client is not running at the moment, it will open. If the user is not
 * authenticated in Zoom, this link will fail since unauthenticated users aren't allowed to use Zoom apps.
 */
export const zoomDeepLinkEndpoint = httpEndpoint(withHttpUser, async (request, response) => {
  if (!request.user) throw new HttpError(401, 'Unauthorized');

  // Fetch the zoom credentials for the user.
  const credentials = await fetchZoomIdentifiers(request.user.id);
  if (!credentials) throw new Error('User has no zoom credentials');

  // Redirect the user to the Zoom App.
  const zoomApi = new ZoomAPI({credentials: credentials.zoomTokens, userId: request.user.id});
  response.redirect(await zoomApi.createDeepLink());
});
