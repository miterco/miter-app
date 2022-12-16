import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const deleteUserById = (userId: string) => {
  return prisma.user.delete({where: {id: userId}});
};
