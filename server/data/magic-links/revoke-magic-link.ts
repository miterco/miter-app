import { getPrismaClient } from '../prisma-client';

const prisma = getPrismaClient();

/**
 * Revokes an existing magic link.
 *
 * @param token - The token to be revoked.
 *
 * @returns the deleted magic link token.
 */
export const revokeMagicLink = async (token: string) => {
  if (!token) throw new Error('Invalid magic link token');

  return await prisma.magicLink.update({
    where: { token },
    data: { revoked: true },
  });
};
