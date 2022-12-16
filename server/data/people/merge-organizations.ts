import {getPrismaClient} from '../prisma-client';
import {fetchOrganizationById} from './fetch-organization';

const prisma = getPrismaClient();

export const mergeOrganizations = async (primaryId: string, mergingId: string) => {
  const primaryOrganization = await fetchOrganizationById(primaryId);
  const mergingOrganization = await fetchOrganizationById(mergingId);
  if (mergingOrganization.isLocked && !primaryOrganization.isLocked) {
    throw new Error('Attempting to merge locked organization into unlocked organzation');
  }

  await prisma.$transaction([
    prisma.domain.updateMany({
      where: {
        organizationId: mergingId,
      },
      data: {
        organizationId: primaryId,
      },
    }),

    prisma.person.updateMany({
      where: {
        organizationId: mergingId,
      },
      data: {
        organizationId: primaryId,
      },
    }),
    prisma.user.updateMany({
      where: {
        organizationId: mergingId,
      },
      data: {
        organizationId: primaryId,
      },
    }),

    prisma.meeting.updateMany({
      where: {
        organizationId: mergingId,
      },
      data: {
        organizationId: primaryId,
      },
    }),

    prisma.organization.delete({
      where: {
        id: mergingId,
      },
    }),
  ]);

  return true;
};
