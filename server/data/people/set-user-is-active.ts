import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();

export const setUserIsActive = async (id: string, isActive: boolean) => {

  const result = prisma.user.update({
    where: {
      id,
    },
    data: {
      isActive,
    }
  });

  return result;
};


