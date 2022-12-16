import { Topic } from 'miter-common/SharedTypes';
import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();

export const fetchTopic = async (id: string): Promise<Topic | null> => {

  const topicInfo = await prisma.topic.findUnique({
    where: {
      id
    },
  });

  if (topicInfo === null) {
    console.warn(`Attempted to fetch topic, ID: ${id} not found.`);
    return null;
  }

  return ({
    ...topicInfo,
  });

};