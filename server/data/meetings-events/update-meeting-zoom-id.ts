import {Meeting} from 'miter-common/SharedTypes';
import {meetingFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const updateMeetingZoomId = async (
  id: Meeting['id'],
  zoomMeetingId: Meeting['zoomMeetingId']
): Promise<Meeting> => {
  const meeting = await prisma.meeting.update({
    where: {id},
    data: {zoomMeetingId},
  });

  return meetingFromPrismaType(meeting);
};
