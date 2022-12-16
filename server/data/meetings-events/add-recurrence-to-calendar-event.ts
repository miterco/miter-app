import { getPrismaClient } from '../prisma-client';
import { fetchCalendarEventByGoogleId } from './fetch-calendar-event';

const prisma = getPrismaClient();

export const addRecurrenceToCalendarEventByGoogleId = async (serviceId: string) => {

  const initialCalendarEvent = await fetchCalendarEventByGoogleId(serviceId);

  if (!initialCalendarEvent) throw (`Initial Calendar Event does not exist for Service ID: ${serviceId}`);

  const updatedCalendarEvent = await prisma.calendarEvent.update({
    where: {
      id: initialCalendarEvent.id,
    },
    data: {
      recurringCalendarEvent: {
        connectOrCreate: {
          where: {
            id: initialCalendarEvent.id,
          },
          create: {
            id: initialCalendarEvent.id,
            serviceId,
            meetingSeries: {
              create: {
                title: initialCalendarEvent.title || " ",
              }
            }
          },
        }
      }
    },
    include: {
      recurringCalendarEvent: {
        include: {
          meetingSeries: true,
        }
      }
    }
  });

  const meetingSeriesId = updatedCalendarEvent.recurringCalendarEvent?.meetingSeriesId;
  if (!meetingSeriesId) throw 'Here for TS reasons, delete once meetingSeriesId required on recurringCalendarEvent';

  // Update associated Meeting with new Recurring Meeting
  await prisma.meeting.update({
    where: {
      id: initialCalendarEvent.meetingId,
    },
    data: {
      meetingSeries: {
        connect: {
          id: meetingSeriesId
        }
      }
    }
  });

  return updatedCalendarEvent;

};