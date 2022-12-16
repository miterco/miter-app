import {getPrismaClient} from '../prisma-client';
import {Meeting} from 'miter-common/SharedTypes';
import {meetingFromPrismaType_updateGoalExempt} from '../data-util';

const prisma = getPrismaClient();

export const setZoomMeetingIdentifiers = async (
  meetingId: Meeting['id'],
  zoomMeetingNID: string | undefined | null,
  zoomMeetingUID: string | null
): Promise<Meeting> => {
  const updatedMeeting = await prisma.meeting.update({
    where: {id: meetingId},
    data: {
      zoomMeetingId: zoomMeetingUID,
      zoomNumericMeetingId: zoomMeetingNID,
    },
  });

  return meetingFromPrismaType_updateGoalExempt(updatedMeeting);
};
