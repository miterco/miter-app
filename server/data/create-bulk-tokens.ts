import {MeetingWithTokenValue} from 'miter-common/SharedTypes';
import {getPrismaClient} from './prisma-client';
import {meetingFromPrismaType_updateGoalExempt} from './data-util';

const prisma = getPrismaClient();

export const createOrFetchBulkTokensForMeetingIds = async (meetingIds: string[]): Promise<MeetingWithTokenValue[]> => {
  const result: MeetingWithTokenValue[] = [];
  const meetingIdsWithoutTokens: string[] = [];

  const meetingTokenList = await prisma.meeting.findMany({
    where: {
      id: {
        in: meetingIds,
      },
      isTemplate: false,
    },
    include: {
      meetingToken: true,
    },
  });

  meetingTokenList.forEach(({meetingToken, ...meetingInfo}) => {
    const meeting = meetingFromPrismaType_updateGoalExempt(meetingInfo);
    if (meetingToken.length > 0) result.push({...meeting, tokenValue: meetingToken[0].value});
    else meetingIdsWithoutTokens.push(meeting.id);
  });

  if (meetingIdsWithoutTokens.length > 0) {
    const newTokens = await createBulkTokensForMeetingIds(meetingIdsWithoutTokens);
    result.push(...newTokens);
  }

  // TODO: MOVE sort to endpoints and out of data functions
  result.sort((a: MeetingWithTokenValue, b: MeetingWithTokenValue) => {
    const startA = a.startDatetime?.getTime() || 0; // TS munging - null or undefined date should not be returned by Prisma
    const startB = b.startDatetime?.getTime() || 0;

    if (startA === startB) return 0;
    if (startA < startB) return -1;
    return 1;
  });

  return result;
};

export const createBulkTokensForMeetingIds = async (meetingIds: string[]): Promise<MeetingWithTokenValue[]> => {
  const result: MeetingWithTokenValue[] = [];

  // Using for loop & create rather than createMany as createMany does not return inserted rows, just the # inserted
  for (let i = 0; i < meetingIds.length; i++) {
    const upsertedToken = await prisma.meetingToken.create({
      data: {
        meeting: {
          connect: {
            id: meetingIds[i],
          },
        },
      },
      include: {
        meeting: true,
      },
    });

    const meeting = meetingFromPrismaType_updateGoalExempt(upsertedToken.meeting);
    result.push({...meeting, tokenValue: upsertedToken.value});
  }

  return result;
};
