import {UpdateTopicRequest, Topic} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const updateTopic = async (topic: Omit<UpdateTopicRequest, 'meetingId'>): Promise<Topic> => {
  const updatedTopic = await prisma.topic.update({
    where: {
      id: topic.id,
    },
    data: {
      ...topic,
      id: undefined,
    },
  });

  if (!updatedTopic) throw new Error(`Tried and failed to edit topic with ID ${topic.id}`);

  return updatedTopic;
};
