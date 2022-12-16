import {v4 as uuid} from 'uuid';
import {fetchZoomIdentifiers} from '../fetch-zoom-identifiers';
import {setUserZoomCredentials} from './set-user-zoom-credentials';

const zoomUserId = '1de4a41d-9fcf-43a3-8e1d-cb12d316dce1';
const userIdForZoomUser = '746f7ff7-f198-429c-bdbe-638812b89878';
const zoomTokens = {
  access_tokens: uuid().toString(),
  refresh_tokens: uuid().toString(),
};

test('setUserZoomCredentials', async () => {
  await setUserZoomCredentials(userIdForZoomUser, null, null);
  let user = await fetchZoomIdentifiers(userIdForZoomUser);
  expect(user?.zoomTokens).toBeUndefined();
  expect(user?.zoomUserId).toBeUndefined();

  // Set the new credentials and test that they were actually set.
  await setUserZoomCredentials(userIdForZoomUser, zoomUserId, zoomTokens);
  user = await fetchZoomIdentifiers(userIdForZoomUser);
  expect(user?.zoomTokens?.toString()).toBe(zoomTokens?.toString());
  expect(user?.zoomUserId).toBe(zoomUserId);
});
