import { MeetingWithContentFlags } from '../../server-core/server-types';
import { meetingFromPrismaType_updateGoalExempt } from '../data-util';
import { getPrismaClient } from '../prisma-client';

/* Commented this out because we don't seem to be using it.
export const fetchMeetingsFromMeetingSeries = async (meetingSeriesId: string): Promise<Meeting[]> => {

  const prisma = getPrismaClient();

  const meetingList = await prisma.meeting.findMany({
    where: {
      meetingSeriesId,
    },
  });

  return meetingList.map(meeting => meetingFromPrismaType(meeting));;

};
*/

export const fetchPastMeetingsFromMeetingSeries = async (meetingSeriesId: string, cutoffTime: Date, includeHasTopics: boolean = false, includeHasNotes: boolean = false, includeHasSummaryItems: boolean = false): Promise<MeetingWithContentFlags[]> => {

  const prisma = getPrismaClient();

  const pastMeetings = await prisma.meeting.findMany({
    where: {
      meetingSeriesId,
      startDatetime: {
        lt: cutoffTime,
      },
    },
    orderBy: {
      startDatetime: 'desc',
    },
    include: {
      topics: Boolean(includeHasTopics),
      note: Boolean(includeHasNotes),
      summaryItem: Boolean(includeHasSummaryItems),
    }
  });

  if (pastMeetings.length === 0) return [];

  const meetingList: MeetingWithContentFlags[] = pastMeetings.map(meetingRow => {

    const hasTopics = includeHasTopics ? meetingRow.topics && meetingRow.topics.length > 0 : undefined;
    const hasNotes = includeHasNotes ? meetingRow.note && meetingRow.note.length > 0 : undefined;
    const hasSummaryItems = includeHasSummaryItems ? meetingRow.summaryItem && meetingRow.summaryItem.length > 0 : undefined;

    const result: MeetingWithContentFlags = { meeting: meetingFromPrismaType_updateGoalExempt(meetingRow), hasTopics, hasNotes, hasSummaryItems };
    return result;
  });

  return meetingList;

};


export const fetchFirstMeetingFromMeetingSeries = async (meetingSeriesId: string, includeHasTopics: boolean = false, includeHasNotes: boolean = false, includeHasSummaryItems: boolean = false): Promise<MeetingWithContentFlags> => {

  const prisma = getPrismaClient();

  const firstMeeting = await prisma.meeting.findFirst({
    where: {
      meetingSeriesId,
      isFirstMeetingInSeries: true,
    },
    include: {
      topics: Boolean(includeHasTopics),
      note: Boolean(includeHasNotes),
      summaryItem: Boolean(includeHasSummaryItems),
    }
  });

  if (!firstMeeting) throw `First Instance not found for Meeting Series ID: ${meetingSeriesId}`;

  const hasTopics = includeHasTopics ? firstMeeting.topics && firstMeeting.topics.length > 0 : undefined;
  const hasNotes = includeHasNotes ? firstMeeting.note && firstMeeting.note.length > 0 : undefined;
  const hasSummaryItems = includeHasSummaryItems ? firstMeeting.summaryItem && firstMeeting.summaryItem.length > 0 : undefined;

  const result: MeetingWithContentFlags = {
    meeting: meetingFromPrismaType_updateGoalExempt(firstMeeting),
    hasTopics,
    hasNotes,
    hasSummaryItems,
  };

  return result;

};


