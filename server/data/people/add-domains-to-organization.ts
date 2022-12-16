import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const addDomainsToOrganization = async (domainIds: string[], organizationId: string) => {
  // To DO: In future versions, we do want to allow this function to overwrite existing values in very special
  // circumstances (i.e. a wholesale domain switch to a new org). For now, the assumption is that we never want
  // to programatically switch an organization  for an existing person.

  const domains = await prisma.domain.findMany({
    where: {
      id: {
        in: domainIds,
      },
    },
  });

  domains.forEach(row => {
    if (row.organizationId) {
      throw new Error(`Domain ${row.name} already connected to organization ${row.organizationId}`);
    }
  });

  const people = await prisma.person.findMany({
    where: {
      emailAddress: {
        some: {
          domainId: {
            in: domainIds,
          },
        },
      },
    },
  });

  people.forEach(row => {
    if (row.organizationId) {
      throw new Error(
        `Person ${row.id} | ${row.displayName} is already connected to organization ${row.organizationId}`
      );
    }
  });

  const personIds = people.map(row => row.id);

  await prisma.$transaction([
    prisma.domain.updateMany({
      where: {
        id: {
          in: domainIds,
        },
      },
      data: {
        organizationId,
      },
    }),

    prisma.person.updateMany({
      where: {
        id: {
          in: personIds,
        },
      },
      data: {
        organizationId,
      },
    }),

    prisma.user.updateMany({
      where: {
        personId: {
          in: personIds,
        },
      },
      data: {
        organizationId,
      },
    }),
  ]);
};
