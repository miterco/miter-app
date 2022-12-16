import {standardUserFieldsForPrisma, UserRecord} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchActiveUsers = async (): Promise<UserRecord[]> => {
  const result = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: standardUserFieldsForPrisma,
  });

  if (!result) return [];
  return result;
};
