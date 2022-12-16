import { Meeting } from 'miter-common/SharedTypes';
import { meetingFromPrismaType } from '../data-util';
import { getPrismaClient } from '../prisma-client';
import { fetchTopic } from './fetch-topic';

const prisma = getPrismaClient();

export const setCurrentTopicForMeeting = async (meeting: Meeting, topicId: string): Promise<Meeting> => {

  const topic = await fetchTopic(topicId);

  if (topic?.meetingId !== meeting.id) throw `setTopicForMeeting: Topic ${topicId} does not match Meeting ${meeting.id}`;

  const updatedMeeting = await prisma.meeting.update({
    where: {
      id: meeting.id,
    },
    data: {
      currentTopic: {
        connect: {
          id: topic.id,
        }
      },
    }
  });

  return meetingFromPrismaType(updatedMeeting);
};