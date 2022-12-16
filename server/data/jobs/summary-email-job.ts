import {JobStatus} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';
import {getDefaultAutomatedSendTime} from './email-job-util';

const prisma = getPrismaClient();

export const cancelSummaryEmailJobsForMeeting = async (meetingId: string) => {
  const canceledAt = new Date();

  const canceledJobCount = await prisma.jobsEmail.updateMany({
    where: {
      meetingId,
      sentAt: null,
      jobStatus: {in: ['NotStarted', 'Failed']},
    },
    data: {
      sendAfter: null,
      jobStatus: 'Canceled',
      canceledAt,
    },
  });

  return canceledJobCount.count;
};

export const updateSummaryEmailJobsSendAfter = async (
  meetingId: string,
  sendAfter: Date = getDefaultAutomatedSendTime()
) => {
  const jobsUpdated = await prisma.jobsEmail.updateMany({
    where: {
      meetingId,
      jobStatus: JobStatus.NotStarted,
    },
    data: {
      sendAfter,
    },
  });

  return jobsUpdated.count;
};
