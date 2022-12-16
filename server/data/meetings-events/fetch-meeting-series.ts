import { MeetingSeries } from 'miter-common/SharedTypes';
import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();

export const fetchMeetingSeries = async (meetingSeriesId: string): Promise<MeetingSeries> => {

  const meetingSeries = await prisma.meetingSeries.findUnique({
    where: {
      id: meetingSeriesId,
    },
  });

  if (!meetingSeries) throw new Error(`Meeting Series: ${meetingSeriesId} not found`);

  return meetingSeries;

};