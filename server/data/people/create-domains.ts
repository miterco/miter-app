import {isWorkDomain} from 'miter-common/CommonUtil';
import {Domain} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

// I would love to transactionalize this, but don't think it's currently possible
export const createDomains = async (domainNames: string[]): Promise<Domain[]> => {
  // We only want to create domains for corporate email domains. Filter out gmail.com, etc.
  const validDomains = domainNames.filter(row => isWorkDomain(row));

  const data = validDomains.map(row => {
    return {name: row};
  });

  const result = await prisma.domain.createMany({
    data,
  });

  if (result.count !== domainNames.length) {
    console.error(`createDomains received ${domainNames.length} records but created ${result.count} records`);
  }

  const createdDomains = await prisma.domain.findMany({
    where: {
      name: {
        in: validDomains,
      },
    },
  });

  for (let i = 0; i < createdDomains.length; i++) {
    await prisma.emailAddress.updateMany({
      where: {
        domainName: createdDomains[i].name,
      },
      data: {
        domainId: createdDomains[i].id,
      },
    });
  }

  return createdDomains;
};
