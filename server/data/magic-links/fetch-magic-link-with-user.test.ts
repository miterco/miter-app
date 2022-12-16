import * as uuid from 'uuid';
import {magicLink as MagicLink} from '@prisma/client';
import {fetchMagicLinkWithUser} from './fetch-magic-link-with-user';
import {createMagicLink} from './create-magic-link';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import {deleteUserById} from '../people/delete-user';
import {getPrismaClient} from '../prisma-client';
import {UserRecord} from '../../server-core/server-types';

const prisma = getPrismaClient();

describe('fetchMagicLinkWithUser', () => {
  let existingMagicLink: MagicLink;
  let user: UserRecord;

  beforeAll(async () => {
    user = await insertTestUser(testName());
    existingMagicLink = await createMagicLink(user.id);
  });

  it('should return null when the provided token is invalid', async () => {
    const magicLink = await fetchMagicLinkWithUser(uuid.v4());
    expect(magicLink).toBe(null);
  });

  it('should return the magic link record when provided a valid token', async () => {
    const magicLink = await fetchMagicLinkWithUser(existingMagicLink.token);

    expect(magicLink).not.toBeNull();
    expect(magicLink?.createdAt.toISOString()).toBe(existingMagicLink.createdAt.toISOString());
    expect(magicLink?.token).toBe(existingMagicLink.token);
    expect(magicLink?.tokenExpiresAt.toISOString()).toBe(existingMagicLink.tokenExpiresAt.toISOString());
    expect(magicLink?.revoked).toBe(existingMagicLink.revoked);
  });

  it.todo('should return null if the requested token is revoked');

  it('should include the related user record', async () => {
    const magicLink = await fetchMagicLinkWithUser(existingMagicLink.token);
    expect(magicLink?.user.id).toBe(user.id);
  });

  afterAll(async () => {
    // Clean-up.
    prisma.magicLink.delete({where: {token: existingMagicLink.token}});
    deleteUserById(user.id);
  });
});
