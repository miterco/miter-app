import { getPrismaClient } from '../prisma-client';


export const setUserHubspotCredentials = async (userId: string, hubspotId: string) => {
  const prisma = getPrismaClient();

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      hubspotId,
    },
  });

  return result;
};