import {getPrismaClient} from './prisma-client';
import {UserGoogleIdentifiers} from '../server-core/server-types';

const prisma = getPrismaClient();

// NOTE: The assumption here is that isActive applies to Google. Revisit as we get different types of Active.
export const editGoogleIdentifiers = async (
  miterId: string,
  updates: {
    gcalPushChannel?: string | undefined;
    gcalResourceId?: string | undefined;
    gcalSyncToken?: string | undefined;
    gcalPushChannelExpiration?: Date | null;
    tokens?: Record<string, any> | undefined;
    serviceId?: string | undefined;
  }
): Promise<UserGoogleIdentifiers> => {
  const user = await prisma.user.update({
    where: {id: miterId},
    data: {
      ...updates,
      isActive: true,
    },
  });

  return {
    id: user.id,
    serviceId: user.serviceId,
    gcalPushChannel: user.gcalPushChannel,
    gcalResourceId: user.gcalResourceId,
    gcalSyncToken: user.gcalSyncToken,
    tokens: user.tokens as Record<string, any>,
  };
};
