import {insertTestUser} from '../../testing/generate-test-data';
import {createAuthToken} from './create-auth-token';
import {fetchOrCreateAuthToken} from './fetch-auth-token';

const ExpectedExpirationTime = 3600 * 1000; // One hour.
const MaxTestDuration = 10000; // Ten seconds to account for the time taken by the test to run.
const IpAddress = '127.0.0.1';
const UserAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36';

test('createAuthToken', async () => {
  const testUser = await insertTestUser('Auth Token User');
  const authToken = await createAuthToken(testUser.id, UserAgent, IpAddress);

  // Test the object return by createAuthToken();
  expect(authToken.userId).toEqual(testUser.id);
  expect(authToken.userAgent).toEqual(UserAgent);
  expect(authToken.ipAddress).toEqual(IpAddress);
  expect(authToken.refreshToken).not.toBeNull();
  expect(authToken.accessToken).not.toBeNull();

  // Test that the right data was saved to the database.
  const dbRecord = await fetchOrCreateAuthToken(authToken.accessToken, authToken.refreshToken);

  expect(dbRecord).not.toBeNull();

  if (dbRecord) {
    expect(dbRecord.userId).toEqual(testUser.id);
    expect(dbRecord.accessToken).toEqual(authToken.accessToken);
    expect(dbRecord.refreshToken).toEqual(authToken.refreshToken);
    expect(dbRecord.userAgent).toEqual(UserAgent);
    expect(dbRecord.ipAddress).toEqual(IpAddress);

    // Test the expiration date. Add an offset of a few seconds to account for the time it takes the test to run.
    const remainingTime = dbRecord.tokenExpiresAt.getTime() - Date.now();
    expect(remainingTime).toBeGreaterThanOrEqual(ExpectedExpirationTime - MaxTestDuration);
  }
});
