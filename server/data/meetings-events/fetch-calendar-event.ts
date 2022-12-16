import {getPrismaClient} from '../prisma-client';
import {FullCalendarEventRecord} from '../../server-core/server-types';

const prisma = getPrismaClient();

const fetchCalendarEvent = async (
  whereKey: 'id' | 'serviceId',
  whereValue: string
): Promise<FullCalendarEventRecord | null> => {
  const calendarEvent = await prisma.calendarEvent.findUnique({
    where: {
      [whereKey]: whereValue,
    },
    include: {
      meeting: true,
    },
  });

  if (calendarEvent === null) return null;
  return {
    ...calendarEvent,
  };
};

export const fetchCalendarEventByMiterId = async (miterId: string): Promise<FullCalendarEventRecord | null> => {
  return await fetchCalendarEvent('id', miterId);
};

export const fetchCalendarEventByGoogleId = async (
  googleId: string | null
): Promise<FullCalendarEventRecord | null> => {
  if (!googleId) return null;
  return await fetchCalendarEvent('serviceId', googleId);
};

export const fetchCalendarEventByMeetingId = async (meetingId: string): Promise<FullCalendarEventRecord | null> => {
  const calendarEvent = await prisma.calendarEvent.findFirst({
    // Change to findUnique when we require meeting on calendarEvent
    where: {
      meeting: {
        id: meetingId,
      },
    },
    include: {
      meeting: true,
    },
  });

  if (!calendarEvent) return null;

  return calendarEvent;
};