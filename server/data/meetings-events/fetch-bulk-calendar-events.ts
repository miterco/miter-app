import { FullCalendarEventRecord } from '../../server-core/server-types';
import { getPrismaClient } from '../prisma-client';

const prisma = getPrismaClient();

export const fetchBulkCalendarEventsByServiceId = async (serviceIds: string[]): Promise<FullCalendarEventRecord[]> => {

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      serviceId: {
        in: serviceIds,
      },
    },
  });

  return calendarEvents;
};