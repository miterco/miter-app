import {SummaryItem} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

// NOTE: Returns null to support use cases around pinning notes. Could be target of some future refactor.
export const fetchSummaryItem = async (id: string): Promise<SummaryItem | null> => {
  const summaryItem = await prisma.summaryItem.findUnique({
    where: {id},
  });

  if (!summaryItem) return null;
  return summaryItem;
};
