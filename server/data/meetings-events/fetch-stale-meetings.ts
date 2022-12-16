import {meeting} from '@prisma/client';
import {MeetingPhase} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

const StaleAfterMinutes = 10; // If a meeting has been empty for >10m, consider it stale

export const fetchStaleMeetings = async (): Promise<meeting[]> => {
  const phase: MeetingPhase = 'InProgress';
  return await prisma.meeting.findMany({
    where: {
      idleDate: {lt: new Date(new Date().getTime() - StaleAfterMinutes * 60 * 1000)},
      phase,
    },
  });
};
