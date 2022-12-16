import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export type UnsavedGoogleEvent = {
  eventId: string;
  event: string;
  createdByProcess: string;
};

export const logEventJson = async (events: UnsavedGoogleEvent[]) => {
  try {
    const loggedEvent = await prisma.googleEventLog.createMany({
      data: events,
    });
    return Boolean(loggedEvent);
  } catch {
    console.log(
      `G Cal JSON Event logging failed for ${events.length} events. First service Id is ${events[0].eventId}`
    );
    return false;
  }
};
