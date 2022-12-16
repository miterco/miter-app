import { getPrismaClient } from './prisma-client';
import { UserZoomIdentifiers, UserRecord } from '../server-core/server-types';

const prisma = getPrismaClient();


export const fetchZoomIdentifiers = async (userId: UserRecord['id']): Promise<UserZoomIdentifiers | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId }});

  if (!user?.zoomUserId) return null;

  return {
    ...user,
    zoomTokens: user.zoomTokens as UserZoomIdentifiers['zoomTokens'],
    gcalPushChannel: undefined,
    gcalPushChannelExpiration: undefined,
    gcalResourceId: undefined,
    gcalSyncToken: undefined,
    tokens: undefined,
  };
};
