import {Meeting} from 'miter-common/SharedTypes';
import {calculateIsGoalExempt, meetingFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const createMeeting = async (
  unsavedMeeting: Omit<Meeting, 'id' | 'calendarEventId' | 'isGoalExempt' | 'isTemplate'>
): Promise<Meeting> => {
  const newMeeting = await prisma.meeting.create({
    data: {
      ...unsavedMeeting,

      isGoalExempt: calculateIsGoalExempt(unsavedMeeting.title),
    },
  });

  if (!newMeeting) throw new Error('createMeeting failed to create a meeting.');

  return meetingFromPrismaType(newMeeting);
};
