import {SummaryItem} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchTasksByMeetingSeries = async (
  meetingSeriesId: string,
  personId: string | undefined = undefined
): Promise<SummaryItem[]> => {
  const dbResult = await prisma.meeting.findMany({
    where: {
      meetingSeriesId,
    },
    include: {
      summaryItem: {
        where: {
          itemType: 'Task',
          itemOwnerId: personId,
        },
      },
    },
    orderBy: {
      startDatetime: 'asc',
    },
  });

  const result: SummaryItem[] = [];
  dbResult.forEach(resultRow => {
    resultRow.summaryItem.forEach(summaryItem => result.push(summaryItem));
  });

  return result;
};
