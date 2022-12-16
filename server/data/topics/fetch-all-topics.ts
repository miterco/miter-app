import { Topic } from 'miter-common/SharedTypes';
import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();


export const fetchAllTopicsForMeeting = async (meetingId: string): Promise<Topic[]> => {

  const topics = await prisma.topic.findMany({
    where: {
      meetingId,
    },
    orderBy: {
      order: 'asc',
    }
  });

  return topics;
};