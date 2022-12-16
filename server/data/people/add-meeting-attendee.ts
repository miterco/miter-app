import {getPrismaClient} from '../prisma-client';

import {fetchPersonByUserId} from './fetch-person';

const prisma = getPrismaClient();

export const addMeetingAttendee = async (meetingId: string, userId: string) => {
  const person = await fetchPersonByUserId(userId);

  if (!person) {
    throw `Could not locate user or person for User ID: ${userId}.`;
  }

  // meetingPerson is the name of the @@unique [meetingId, personId] relation in prisma.schema
  const newAttendee = await prisma.meetingPerson.upsert({
    where: {
      meetingIdPersonId: {
        personId: person.id,
        meetingId,
      },
    },
    update: {
      attended: true,
    },
    create: {
      attended: true,
      person: {
        connect: {
          id: person.id,
        },
      },
      meeting: {
        connect: {
          id: meetingId,
        },
      },
    },
  });

  return newAttendee;
};
