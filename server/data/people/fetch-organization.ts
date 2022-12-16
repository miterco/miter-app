import {Organization} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const BlockingOrganizationId = 'db9768ab-837a-4892-b4dc-9a2d25f67eaa';

export const fetchOrganizationByDomain = async (name: string): Promise<Organization | null> => {
  const result = await prisma.organization.findMany({
    where: {
      domain: {
        some: {
          name,
        },
      },
    },
    include: {
      domain: true,
    },
  });

  if (result.length === 0) return null;

  // Note, this should not happen: Essentially recreating Prima's Unique functionality.
  if (result.length > 1) throw `Domain ${name} connected to multiple organizations`;

  return result[0];
};

export const fetchOrganizationById = async (id: string): Promise<Organization> => {
  const organization = await prisma.organization.findUnique({
    where: {
      id,
    },
    include: {
      domain: true,
    },
  });

  if (!organization) throw new Error(`Organization ${id} not found`);

  return organization;
};

export const fetchLockingOrganizationId = async (id: string | null | undefined): Promise<string | null> => {
  if (!id) return null;

  const organization = await fetchOrganizationById(id);
  if (!organization.isLocked) return null;

  return organization.id;
};
