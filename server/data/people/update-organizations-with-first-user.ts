import {getPrismaClient} from '../../data/prisma-client';
import {Organization} from '../../server-core/server-types';

const prisma = getPrismaClient();

export const updateOrganizationsWithFirstUser = async (): Promise<Organization[]> => {
  // This is a little subtle due to Prisma's syntax because we have 2 relations between Users & Oraganizations:
  // 1) Users have a foreign key relationship to organization via the "OrgUsers" relation  (referenced below as "user")
  // 2) Organizations have a foreign to users via the first user signed up via the "FirstOrgUseRelation"
  // So, the query says: Find me all the organizations who already have users and don't yet have a first user calculated
  // Then give me the organizations back (in any order) and the associated users back in order of user created date
  const organizationUserList = await prisma.organization.findMany({
    where: {
      firstSignedUpUserId: null,
      user: {
        some: {},
      },
    },
    include: {
      user: {
        orderBy: {
          createdDate: 'asc',
        },
      },
    },
  });

  const organizations: Organization[] = [];

  // updateMany only works where you have the same where clause for all
  // Note: if the job starts running long, we can put this into a transaction so that we're not waiting on round trips to db
  for (let i = 0; i < organizationUserList.length; i++) {
    const {id} = organizationUserList[i];
    const firstSignedUpUserId = organizationUserList[i].user[0].id;

    const organization = await prisma.organization.update({
      where: {
        id,
      },
      data: {
        firstSignedUpUserId,
      },
      include: {
        domain: true,
      },
    });

    organizations.push(organization);
  }

  return organizations;
};
