import {trackAnalyticsEvent} from '../../server-core/analytics';
import httpEndpoint from '../../server-core/http/http-endpoint';

const {ZOOM_INSTALL_URL} = process.env;

export const zoomInstallEndpoint = httpEndpoint((req, res) => {
  if (!ZOOM_INSTALL_URL) throw new Error('Missing Zoom App install URL');
  trackAnalyticsEvent('Begin Zoom App Install', null);

  return res.redirect(ZOOM_INSTALL_URL);
});
