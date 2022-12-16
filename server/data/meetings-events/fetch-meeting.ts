import {Meeting} from 'miter-common/SharedTypes';
import {MeetingWithContentFlags} from '../../server-core/server-types';
import {meetingFromPrismaType_updateGoalExempt} from '../data-util';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchMeeting = async (id: string): Promise<Meeting> => {
  const meetingInfo = await prisma.meeting.findUnique({
    where: {
      id,
    },
  });

  if (meetingInfo === null) throw new Error(`fetchMeeting failed to fetch a meeting for id ${id}`);

  return meetingFromPrismaType_updateGoalExempt(meetingInfo);
};

export const fetchMeetingByCalendarEvent = async (calendarEventId: string): Promise<Meeting> => {
  const calendarWithMeeting = await prisma.calendarEvent.findUnique({
    where: {
      id: calendarEventId,
    },
    include: {
      meeting: true,
    },
  });

  const meetingInfo = calendarWithMeeting?.meeting;

  if (meetingInfo === null || !meetingInfo?.id) throw `Meeting not found for calendar event id: ${calendarEventId}`;

  return meetingFromPrismaType_updateGoalExempt(meetingInfo);
};

export const fetchMeetingByZoomMeetingId = async (zoomMeetingId: string): Promise<Meeting | null> => {
  return (await prisma.meeting.findUnique({where: {zoomMeetingId}})) as Meeting;
};

export const fetchMeetingByZoomNumericMeetingId = async (zoomNumericMeetingId: string): Promise<Meeting | null> => {
  const results = await prisma.meeting.findMany({
    take: 1,
    orderBy: [{createdDate: 'desc'}],
    where: {zoomNumericMeetingId},
  });

  return results.length ? meetingFromPrismaType_updateGoalExempt(results[0]) : null;
};

export const fetchMeetingContent = async (meetingId: string): Promise<MeetingWithContentFlags> => {
  const meeting = await prisma.meeting.findUnique({
    where: {
      id: meetingId,
    },
    include: {
      topics: true,
      note: true,
      summaryItem: true,
    },
  });

  if (!meeting) throw `Meeting not found for ID: ${meetingId}`;

  const hasTopics = meeting.topics.length > 0;
  const hasNotes = meeting.note.length > 0;
  const hasSummaryItems = meeting.summaryItem.length > 0;

  const result: MeetingWithContentFlags = {
    meeting: meetingFromPrismaType_updateGoalExempt(meeting),
    hasTopics,
    hasNotes,
    hasSummaryItems,
  };

  return result;
};
