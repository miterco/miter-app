import {getPrismaClient} from '../prisma-client';

import {standardUserFieldsForPrisma, UserRecord} from '../../server-core/server-types';

const prisma = getPrismaClient();

export const fetchAttendees = async (meetingId: string): Promise<UserRecord[]> => {
  const meetingsPeople = await prisma.meetingPerson.findMany({
    where: {
      meetingId,
    },
    include: {
      person: {
        include: {
          user: {
            select: standardUserFieldsForPrisma,
          },
        },
      },
    },
  });

  const attendeeUsers: UserRecord[] = [];

  meetingsPeople.forEach(meetingPersonRow => {
    const user = meetingPersonRow.person.user[0];

    if (user) attendeeUsers.push(user);
  });

  return attendeeUsers;
};
