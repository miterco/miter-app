import {getPrismaClient} from '../prisma-client';
import {JobStatus, JobType, UnsavedAutomatedEmailJob, UnsavedManualEmailJob} from '../../server-core/server-types';
import {Prisma} from '.prisma/client';
import {getDefaultAutomatedSendTime} from './email-job-util';

const prisma = getPrismaClient();

const getDateForStatus = (status: JobStatus, targetStatus: JobStatus) =>
  status === targetStatus ? new Date() : undefined;

/*
 * Create an automated email job (that is, one handled by a scheduler rather than user-triggered).
 */
export const createAutomatedEmailJob = async (job: UnsavedAutomatedEmailJob) => {
  if (!job.meetingId) throw new Error(`Need to supply meeting ID for ${job.jobName}`);

  // We only create a job if one hasn't been run already.
  const existingJob = await prisma.jobsEmail.findFirst({
    where: {
      meetingId: job.meetingId,
      jobStatus: {in: [JobStatus.Completed, JobStatus.NotStarted]},
    },
  });
  if (existingJob) return;

  const newJob = await prisma.jobsEmail.create({
    data: {
      jobType: JobType.Automated,
      jobStatus: JobStatus.NotStarted,
      ...job,
      sendAfter: job.sendAfter ?? getDefaultAutomatedSendTime(),
      jobRecipients: job.jobRecipients as unknown as Prisma.JsonArray,
    },
  });

  if (!newJob) throw new Error(`Could not create job ${job.jobName} for meeting ${job.meetingId}.`);
};

export const createManualEmailJob = async (job: UnsavedManualEmailJob) =>
  await prisma.jobsEmail.create({
    data: {
      ...job,
      jobRecipients: job.jobRecipients as unknown as Prisma.JsonArray,
      jobType: JobType.Manual,
      sentAt: getDateForStatus(job.jobStatus, JobStatus.Completed),
      failedAt: getDateForStatus(job.jobStatus, JobStatus.Failed),
      canceledAt: getDateForStatus(job.jobStatus, JobStatus.Canceled),
    },
  });
