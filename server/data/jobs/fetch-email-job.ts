import {getPrismaClient} from '../prisma-client';
import {EmailJobName, EmailJob, JobStatus, JobType} from '../../server-core/server-types';
import {EmailRecipient} from 'miter-common/SharedTypes';

const prisma = getPrismaClient();

export const fetchEmailJob = async (id: string) => {
  const fetchedJob = prisma.jobsEmail.findUnique({
    where: {
      id,
    },
  });

  return fetchedJob;
};

export const fetchReadyToRunEmailJobs = async (jobName: EmailJobName) => {
  const currentTime = new Date();

  const result = await prisma.jobsEmail.findMany({
    where: {
      jobName,
      jobStatus: JobStatus.NotStarted,
      sentAt: null,
      sendAfter: {lt: currentTime},
    },
  });

  const emailJobs: EmailJob[] = result.map(jobRow => ({
    ...jobRow,
    jobName: jobRow.jobName as EmailJobName,
    jobStatus: jobRow.jobStatus as JobStatus,
    jobType: jobRow.jobType as JobType,
    jobRecipients: jobRow.jobRecipients as unknown as EmailRecipient[],
  }));

  return emailJobs;
};

// Only for tests right now
export const fetchEmailJobsForMeeting = async (meetingId: string) => {
  const fetchedJob = await prisma.jobsEmail.findMany({
    where: {
      meetingId,
    },
    orderBy: {
      sendAfter: 'desc',
    },
  });

  return fetchedJob;
};
