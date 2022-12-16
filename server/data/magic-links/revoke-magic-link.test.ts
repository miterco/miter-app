import {getPrismaClient} from '../prisma-client';
import {magicLink as MagicLink} from '@prisma/client';
import {createMagicLink} from './create-magic-link';
import {revokeMagicLink} from './revoke-magic-link';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import {UserRecord} from '../../server-core/server-types';

const prisma = getPrismaClient();

describe('revokeMagicLink', () => {
  let user: UserRecord;
  let originalMagicLink: MagicLink;
  let revokedMagicLink: MagicLink | null;

  beforeAll(async () => {
    user = await insertTestUser(testName());
    originalMagicLink = await createMagicLink(user.id);
    revokedMagicLink = await revokeMagicLink(originalMagicLink.token);
  });

  it('should return the revoked magic link record', async () => {
    expect(revokedMagicLink).not.toBeNull();
    expect(revokedMagicLink).toHaveProperty('token');
    expect(revokedMagicLink).toHaveProperty('userId');
    expect(revokedMagicLink).toHaveProperty('revoked');
    expect(revokedMagicLink).toHaveProperty('createdAt');
    expect(revokedMagicLink).toHaveProperty('tokenExpiresAt');
  });

  it('should revoke the given token', async () => {
    expect(originalMagicLink.revoked).toBe(false);
    expect(revokedMagicLink).not.toBeNull();
    expect(revokedMagicLink?.revoked).toBe(true);
  });

  it('should update the magic token in the database', async () => {
    const magicLinkDbRecord = await prisma.magicLink.findUnique({where: {token: originalMagicLink.token}});

    expect(magicLinkDbRecord).not.toBeNull();
    expect(magicLinkDbRecord?.revoked).toBe(true);
  });

  afterAll(async () => {
    // Clean-up.
    await prisma.magicLink.delete({where: {token: originalMagicLink.token}});
    await prisma.user.delete({where: {id: user.id}});
  });
});
