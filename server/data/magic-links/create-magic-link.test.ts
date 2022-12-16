import * as uuid from 'uuid';
import {UserRecord} from '../../server-core/server-types';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import {createMagicLink} from './create-magic-link';
import {magicLink as MagicLink} from '@prisma/client';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

describe('createMagicLink', () => {
  let user: UserRecord;
  let magicLink: MagicLink;

  beforeAll(async () => {
    user = await insertTestUser(testName());
    magicLink = await createMagicLink(user.id);
  });

  it('should return the created magic link', async () => {
    expect(magicLink).not.toBe(null);
    expect(magicLink.userId).toBe(user.id);
  });

  it('should have a valid token', async () => {
    expect(uuid.validate(magicLink.token)).toBe(true);
  });

  it('should create unique tokens for each magic link', async () => {
    const newMagicLink = await createMagicLink(user.id);
    expect(magicLink.token).not.toBe(newMagicLink.token);
  });

  it('should not create expired magic links', async () => {
    expect(magicLink.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should not create revoked magic links', async () => {
    expect(magicLink.revoked).toBe(false);
  });

  afterAll(async () => {
    // Clean-up.
    await prisma.magicLink.delete({where: {token: magicLink.token}});

    // TODO can't delete user without dealing with its constraints.
    // await prisma.user.delete({where: {id: user.id}});
  });
});
