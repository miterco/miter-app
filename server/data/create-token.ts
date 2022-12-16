import { isTokenValueAvailable } from './fetch-token';
import { MeetingToken } from 'miter-common/SharedTypes';
import { getPrismaClient } from './prisma-client';

const prisma = getPrismaClient();


export interface UnsavedToken {
  meetingId: string;
  value?: string; // Optional -- leave blank to just generate a value
  expirationDate?: Date;
}

export const createToken = async (unsavedToken: UnsavedToken): Promise<MeetingToken> => {

  if (unsavedToken.value && !isTokenValueAvailable(unsavedToken.value)) throw `Value ${unsavedToken.value} is not available to create token for meeting ${unsavedToken.meetingId}`;

  const token = await prisma.meetingToken.create({
    data: {
      value: unsavedToken.value,
      expirationDate: unsavedToken?.expirationDate,
      meetingId: unsavedToken.meetingId,
    }
  });

  if (!token) throw `Token not created for meeting: ${unsavedToken.meetingId}`;

  return token;
};