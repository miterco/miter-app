import { MeetingWithContentFlags } from '../../server-core/server-types';
import { meetingFromPrismaType, meetingFromPrismaType_updateGoalExempt } from '../data-util';
import { getPrismaClient } from '../prisma-client';


export const fetchMeetingsInWindow = async (personId: string, startDatetime: Date, endDateTime: Date, includeHasTopics: boolean = false, includeHasNotes: boolean = false, includeHasSummaryItems: boolean = false): Promise<MeetingWithContentFlags[]> => {

  const prisma = getPrismaClient();

  const result = await prisma.meetingPerson.findMany({
    where: {
      personId,
      meeting: {
        startDatetime: {
          gte: startDatetime,
        },
        endDatetime: {
          lte: endDateTime,
        },

      },
    },
    include: {
      meeting: {
        include: {
          topics: includeHasTopics,
          note: includeHasNotes,
          summaryItem: Boolean(includeHasSummaryItems),
        },
      },
    },
  });

  if (!result || result.length === 0) return [];

  const meetingList: MeetingWithContentFlags[] = result.map(resultRow => {

    const {meeting} = resultRow;
    const hasTopics = includeHasTopics ? meeting.topics && meeting.topics.length > 0 : undefined;
    const hasNotes = includeHasNotes ? meeting.note && meeting.note.length > 0 : undefined;
    const hasSummaryItems = includeHasSummaryItems ? meeting.summaryItem && meeting.summaryItem.length > 0 : undefined;

    const returnRow: MeetingWithContentFlags = { meeting: meetingFromPrismaType_updateGoalExempt(meeting), hasTopics, hasNotes, hasSummaryItems };
    return returnRow;
  });

  meetingList.sort((a: MeetingWithContentFlags, b: MeetingWithContentFlags) => {
    const startA = a.meeting.startDatetime?.getTime() || 0; // TS munging - null or undefined date should not be returned by Prisma
    const startB = b.meeting.startDatetime?.getTime() || 0;

    if (startA === startB) return 0;
    if (startA < startB) return -1;
    return 1;
  });

  return meetingList;

};
