import {Domain} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchDomainByName = async (name: string): Promise<Domain | null> => {
  const domain = await prisma.domain.findUnique({
    where: {
      name,
    },
  });

  return domain;
};
