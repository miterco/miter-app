import {getPrismaClient} from '../prisma-client';

import {calendar_v3} from 'googleapis';

const prisma = getPrismaClient();

export const fetchEventJson = async (eventId: string) => {
  try {
    const fetchedEvent = await prisma.googleEventLog.findFirst({
      where: {
        eventId,
      },
      orderBy: {
        createdDate: 'desc',
      },
    });

    if (!fetchedEvent?.event) {
      return {userId: null, event: null};
    }

    const event =
      typeof fetchedEvent.event === 'string'
        ? JSON.parse(fetchedEvent.event)
        : (fetchedEvent.event as calendar_v3.Schema$Event);

    return {userId: fetchedEvent?.userId, event};
  } catch {
    console.log(`Could not retrieve event id: ${eventId}`);
    return {userId: null, event: null};
  }
};
