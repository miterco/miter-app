import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const setMeetingIdle = async (meetingId: string, isIdle: boolean): Promise<void> => {
  await prisma.meeting.update({
    where: {id: meetingId},
    data: {idleDate: isIdle ? new Date() : null},
  });
};
