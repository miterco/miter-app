import {Prisma} from '.prisma/client';
import {Topic} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const createBulkTopics = async (meetingId: string, topics: Topic[]) => {
  const prismaList: Prisma.topicCreateManyInput[] = [];

  topics.forEach(topic => prismaList.push({...topic, meetingId, id: undefined}));

  await prisma.topic.createMany({
    data: prismaList,
  });
};
