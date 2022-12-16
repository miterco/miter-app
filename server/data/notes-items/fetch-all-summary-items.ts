import {SummaryItem} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchAllSummaryItems = async (meetingId: string): Promise<SummaryItem[]> => {
  return await prisma.summaryItem.findMany({
    where: {
      meetingId,
      NOT: {itemType: 'None'},
    },
    orderBy: {timestamp: 'asc'},
  });
};
