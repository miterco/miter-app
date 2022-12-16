import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

type domainRecord = {name: string; id: string; organizationId?: string | null};

export const fetchOrganizationAndDomainFromDomainNames = async (domainNames: string[]): Promise<domainRecord[]> => {
  const result = await prisma.domain.findMany({
    where: {
      name: {
        in: domainNames,
      },
    },
  });

  return result;
};
