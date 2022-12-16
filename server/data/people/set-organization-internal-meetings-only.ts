import {getPrismaClient} from '../prisma-client';
import {BlockingOrganizationId} from './fetch-organization';

const prisma = getPrismaClient();

export const setOrganizationInternalMeetingsOnly = async (id: string) => {
  const organization = await prisma.organization.update({
    where: {
      id,
    },
    data: {
      isLocked: true,
    },
  });

  const meetingList = await prisma.meeting.findMany({
    where: {
      calendarEvent: {
        calendarEvent_person: {
          some: {
            person: {
              organizationId: id,
            },
          },
        },
      },
    },
  });

  const meetingIdsToBlock: string[] = [];
  const meetingIdsToOrgLock: string[] = [];

  meetingList.forEach(row => {
    if (row.organizationId && row.organizationId !== id) {
      meetingIdsToBlock.push(row.id);
    } else {
      meetingIdsToOrgLock.push(row.id);
    }
  });

  await prisma.$transaction([
    prisma.meeting.updateMany({
      where: {
        id: {
          in: meetingIdsToBlock,
        },
      },
      data: {
        organizationId: BlockingOrganizationId,
      },
    }),

    prisma.meeting.updateMany({
      where: {
        id: {
          in: meetingIdsToOrgLock,
        },
      },
      data: {
        organizationId: id,
      },
    }),
  ]);

  console.log(`Organization locked: ${organization.name}`);
};
