import { Topic } from 'miter-common/SharedTypes';
import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();

export const createTopic = async (unsavedTopic: Omit<Topic, 'id' | 'order'> & { order?: number; }): Promise<Topic | null> => {
  const newTopic = await prisma.topic.create({
    data: {
      ...unsavedTopic,
    }
  });

  return newTopic;
};

