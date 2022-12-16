import {Request} from 'express';
import {zoomInstallEndpoint} from './install-endpoint';

const {ZOOM_INSTALL_URL} = process.env;

test('zoomInstallEndpoint', () => {
  const req = {} as Request;
  const res = {redirect: jest.fn()} as any;

  zoomInstallEndpoint(req, res);

  // Should redirect to the Zoom installation URL.
  expect(res.redirect.mock.calls).toHaveLength(1);
  expect(res.redirect.mock.calls[0][0]).toEqual(ZOOM_INSTALL_URL);
});
