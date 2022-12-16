import {SummaryItem} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchSummaryItemByNote = async (noteId: string): Promise<SummaryItem | null> => {
  const summaryItem = await prisma.summaryItem.findUnique({
    where: {noteId},
  });

  if (!summaryItem) return null;

  return summaryItem;
};
