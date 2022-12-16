import {SummaryItem} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchTask = async (taskId: string): Promise<SummaryItem> => {
  const summaryItem = await prisma.summaryItem.findUnique({
    where: {
      id: taskId,
    },
  });

  if (!summaryItem || summaryItem.itemType !== 'Task') throw new Error(`Task not found for ID: ${taskId}`);

  return summaryItem;
};
