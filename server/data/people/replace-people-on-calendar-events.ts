import {getPrismaClient} from '../prisma-client';

import {Attendee} from '../../server-core/server-types';
import {PrismaPromise} from '.prisma/client';
import {BlockingOrganizationId} from './fetch-organization';

const prisma = getPrismaClient();

export const replacePeopleOnCalendarEvent = async (calendarEventId: string, attendees: Attendee[]) => {
  const queryList: PrismaPromise<any>[] = [];

  const personIds = attendees.map(row => row.id);

  // We only do this for an existing calendar event so we know meeting exists and there can only be one meeting per calendare event
  const meetingData = await prisma.meeting.findFirst({
    where: {
      calendarEvent: {
        id: calendarEventId,
      },
    },
    include: {
      topics: true,
      note: true,
      summaryItem: true,
    },
  });

  if (!meetingData) {
    throw new Error(`Meeting Data not found for Calendar Event ${calendarEventId} - should be impossible`);
  }

  // Org Locking Algorithm:
  // If a meeting already has data on it, i.e. topics, notes, or summary items, just freeze it in place,
  // i.e. whoever had access, that shouldn't be lost
  //
  // If a meeting does not have data on it, you can still recompute :
  // No people with locked organizations = Not locked
  // Only 1 distinct locked organization = Lock to that Org
  // >1 distinct locked organizations = Block meeting entirely

  if (meetingData.note.length === 0 && meetingData.topics.length === 0 && meetingData.summaryItem.length === 0) {
    const lockingOrganizations = await prisma.organization.findMany({
      where: {
        isLocked: true,
        person: {
          some: {
            id: {
              in: personIds,
            },
          },
        },
      },
    });

    if (lockingOrganizations.length === 0) {
      queryList.push(
        prisma.meeting.update({
          where: {
            id: meetingData.id,
          },
          data: {
            organizationId: null,
          },
        })
      );
    } else if (lockingOrganizations.length === 1) {
      queryList.push(
        prisma.meeting.update({
          where: {
            id: meetingData.id,
          },
          data: {
            organizationId: lockingOrganizations[0].id,
          },
        })
      );
    } else {
      queryList.push(
        prisma.meeting.update({
          where: {
            id: meetingData.id,
          },
          data: {
            organizationId: BlockingOrganizationId,
          },
        })
      );
    }
  }

  queryList.push(
    prisma.calendarEventPerson.deleteMany({
      where: {
        calendarEventId,
      },
    })
  );

  for (let i = 0; i < attendees.length; i++) {
    const attendee = attendees[i];

    queryList.push(
      prisma.calendarEventPerson.upsert({
        where: {
          calendarEventPersonEmail: {
            calendarEventId,
            personId: attendee.id,
            personEmailId: attendee.emailAddressId,
          },
        },
        update: {},
        create: {
          calendarEvent: {
            connect: {
              id: calendarEventId,
            },
          },
          person: {
            connect: {
              id: attendee.id,
            },
          },
          emailAddress: {
            connect: {
              id: attendee.emailAddressId,
            },
          },
          responseStatus: attendee.responseStatus,
          optional: attendee.optional,
        },
      })
    );
  }

  await prisma.$transaction(queryList);
};
