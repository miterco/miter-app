import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

/**
 * Fetches a magic link record by its token along with the referenced user.
 *
 * @param token - the magic link token.
 * @returns the magic link record.
 */
export const fetchMagicLinkWithUser = async (token: string) => {
  if (!token) throw new Error('Invalid magic link token');

  const magicLink = await prisma.magicLink.findUnique({
    where: {token},
    include: {user: true},
  });

  return magicLink?.revoked ? null : magicLink;
};
