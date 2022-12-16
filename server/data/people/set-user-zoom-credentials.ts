import {Prisma} from '@prisma/client';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const setUserZoomCredentials = async (
  id: string,
  zoomUserId: string | null | undefined,
  zoomTokens: Record<string, any> | null
) => {
  return prisma.user.update({
    where: {id},
    data: {
      zoomUserId,
      zoomTokens: zoomTokens || Prisma.DbNull,
    },
  });
};