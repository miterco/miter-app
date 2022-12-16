import { Meeting } from 'miter-common/SharedTypes';
import { meetingFromPrismaType } from '../data-util';
import { getPrismaClient } from '../prisma-client';

const prisma = getPrismaClient();

// This function takes in Meeting, not because it needs Meeting but because setCurrentTopicForMeeting does need it 
// and it's nice to have the symmetry
export const removeCurrentTopicFromMeeting = async (meeting: Meeting): Promise<Meeting> => {
  const updatedMeeting = await prisma.meeting.update({
    where: {
      id: meeting.id,
    },
    data: {
      currentTopic: {
        disconnect: true,
      },
    }
  });

  return meetingFromPrismaType(updatedMeeting);
};