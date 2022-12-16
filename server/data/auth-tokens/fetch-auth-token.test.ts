import {v4 as uuid} from 'uuid';
import {getPrismaClient} from '../prisma-client';
import {fetchOrCreateAuthToken} from './fetch-auth-token';
import {createAuthToken} from './create-auth-token';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import {UserRecord} from '../../server-core/server-types';

const prisma = getPrismaClient();

describe('fetchOrCreateAuthToken', () => {
  let user: UserRecord;
  let existingAuthToken: any;
  let fetchedAuthToken: any;

  beforeAll(async () => {
    user = await insertTestUser(testName());
    existingAuthToken = await createAuthToken(user.id);
    fetchedAuthToken = await fetchOrCreateAuthToken(existingAuthToken.accessToken, existingAuthToken.refreshToken);
  });

  it("should return null if the token doesn't exist", async () => {
    const authToken = await fetchOrCreateAuthToken(uuid(), uuid());
    expect(authToken).toBe(null);
  });

  it('should return the authToken database entry if the token exist', async () => {
    expect(fetchedAuthToken).not.toBe(null);
    expect(fetchedAuthToken?.userId).toBe(user.id);
    expect(fetchedAuthToken?.accessToken).toBe(existingAuthToken.accessToken);
    expect(fetchedAuthToken?.refreshToken).toBe(existingAuthToken.refreshToken);
    expect(fetchedAuthToken?.createdAt.toISOString()).toBe(existingAuthToken.createdAt.toISOString());
  });

  it('should include the related user', async () => {
    expect(fetchedAuthToken?.user.id).toBe(user.id);
  });

  it.todo('should refresh the token when it has expired');
  it.todo('should not return revoked tokens');

  afterAll(async () => {
    // Clean-up.
    await prisma.authToken.delete({where: {accessToken: existingAuthToken.accessToken}});
    await prisma.user.delete({where: {id: user.id}});
  });
});
