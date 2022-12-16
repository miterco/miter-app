import {UpdateMeetingRequest, Meeting} from 'miter-common/SharedTypes';
import {calculateIsGoalExempt, meetingFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const updateMeeting = async (
  requestBody: UpdateMeetingRequest & {id: string; isSampleMeeting?: boolean; currentProtocolId?: string | null}
): Promise<Meeting> => {
  const meeting = await prisma.meeting.update({
    where: {
      id: requestBody.id,
    },
    data: {
      ...requestBody,
      isGoalExempt: requestBody.title !== undefined ? calculateIsGoalExempt(requestBody.title) : undefined,
      id: undefined,
    },
  });

  return meetingFromPrismaType(meeting);
};
