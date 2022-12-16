import * as uuid from 'uuid';
import {UserRecord} from '../server-core/server-types';
import {insertTestUser, testName} from '../testing/generate-test-data';
import {fetchZoomIdentifiers} from './fetch-zoom-identifiers';
import {deleteUserById} from './people/delete-user';
import {setUserZoomCredentials} from './people/set-user-zoom-credentials';

const zoomUserId = uuid.v4();
const zoomTokens = {access_token: 'zoom_access_token'};

describe('fetchZoomIdentifiers', () => {
  let user: UserRecord;

  beforeAll(async () => {
    user = await insertTestUser(testName());
    await setUserZoomCredentials(user.id, zoomUserId, zoomTokens);
  });

  it('should return the user instance with the zoom credentials', async () => {
    const userWithCredentials = await fetchZoomIdentifiers(user.id);

    expect(userWithCredentials).not.toBeNull();
    expect(userWithCredentials?.zoomUserId).toBe(zoomUserId);
    expect(userWithCredentials?.zoomTokens).toStrictEqual(zoomTokens);
  });

  afterAll(async () => {
    // Clean-up.
    await deleteUserById(user.id);
  });
});
