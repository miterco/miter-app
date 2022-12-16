import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

export const fetchAllProtocolTypes = async () => {
  return await prisma.protocolType.findMany({
    include: {
      phases: {orderBy: {index: 'asc'}},
    },
  });
};
