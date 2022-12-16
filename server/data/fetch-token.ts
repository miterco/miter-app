import {Meeting, MeetingToken} from 'miter-common/SharedTypes';
import {createToken} from './create-token';
import {meetingFromPrismaType_updateGoalExempt} from './data-util';
import {getPrismaClient} from './prisma-client';

const prisma = getPrismaClient();

export const fetchMeetingByToken = async (value: string): Promise<Meeting> => {
  const currentTime = new Date();
  const token = await prisma.meetingToken.findMany({
    where: {
      value,
      expirationDate: {
        gt: currentTime,
      },
    },
    include: {
      meeting: true,
    },
  });

  if (token.length === 0 || !token[0].meeting) {
    throw new Error(
      `We were unable locate a meeting with the identifier "${value}". Try double-checking the spelling of your URL.`
    );
  }
  if (token.length > 1) {
    // Should never happen but have to check
    throw new Error(`Miter encountered an unexpected error: token "${value}" has multiple unexpired instances.`);
  }

  return meetingFromPrismaType_updateGoalExempt(token[0].meeting);
};

export const fetchOrCreateMeetingTokenByMeetingId = async (meetingId: string): Promise<MeetingToken> => {
  const meetingTokens = await prisma.meetingToken.findMany({
    where: {
      meetingId,
      expirationDate: {gt: new Date()},
    },
  });

  return meetingTokens.length > 0 ? meetingTokens[0] : await createToken({meetingId});
};

export const isTokenValueAvailable = async (value: string): Promise<boolean> => {
  const currentTime = new Date();

  const token = await prisma.meetingToken.findMany({
    where: {
      value,
      expirationDate: {
        gt: currentTime,
      },
    },
  });

  if (token.length > 0) return false;

  return true;
};
