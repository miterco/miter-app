import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();

export const deletePeopleFromCalendarEvent = async (calendarEvents: string[]) => {

  // This may seem a bit excessive... but under certain circumstances, if we feed {} or [] into deleteMany, it will wipe out the whole table!
  if (!calendarEvents || calendarEvents.length === 0 || !calendarEvents[0]) return 0;

  // Yes, we just checked this. Also, never remove either of these checks and we won't accidentally wipe out the whole table!
  if (calendarEvents[0]) {
    const result = await prisma.calendarEventPerson.deleteMany({
      where: {
        calendarEventId: { in: calendarEvents }
      },
    });
    return result.count;
  }
};
