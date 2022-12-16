import {getPrismaClient} from '../prisma-client';
import {UserRecord} from '../../server-core/server-types';
import {meetingPerson as MeetingPerson} from '@prisma/client';

const prisma = getPrismaClient();

export const fetchMeetingIdsAttendedByPerson = async (personId: UserRecord['personId']) => {
  if (!personId) return [];

  const meetingPeople = await prisma.meetingPerson.findMany({
    where: {personId},
    select: {meetingId: true},
  });

  return meetingPeople.map(({meetingId}) => meetingId);
};
