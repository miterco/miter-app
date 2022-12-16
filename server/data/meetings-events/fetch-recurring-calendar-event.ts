import { RecurringCalendarEvent } from '../../server-core/server-types';
import { getPrismaClient } from '../prisma-client';



const prisma = getPrismaClient();

export const fetchRecurringCalendarEventByGoogleId = async (serviceId: string): Promise<RecurringCalendarEvent | null> => {
  const recurringCalendarEvent = await prisma.recurringCalendarEvent.findUnique({
    where: {
      serviceId,
    },
  });

  if (recurringCalendarEvent === null) return null;
  return {
    ...recurringCalendarEvent
  };

};

