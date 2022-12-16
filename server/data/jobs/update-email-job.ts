import {getPrismaClient} from '../prisma-client';
import {JobStatus} from '../../server-core/server-types';

const prisma = getPrismaClient();

/*
 * Mark an email job as finished (success (Completed) or failure (Failed)).
 */
export const completeEmailJob = async (jobId: string, completedSuccessfully: boolean) => {
  const sentAt = completedSuccessfully ? new Date() : undefined;
  const failedAt = completedSuccessfully ? undefined : new Date();
  const jobStatus = completedSuccessfully ? JobStatus.Completed : JobStatus.Failed;

  const updatedJob = await prisma.jobsEmail.update({
    where: {id: jobId},
    data: {jobStatus, sentAt, failedAt},
  });

  if (!updatedJob.id) throw new Error(`Failed to mark email job ${jobId} as completed`);
  return updatedJob;
};

export const cancelEmailJob = async (id: string) => {
  const canceledAt = new Date();

  const canceledJob = await prisma.jobsEmail.updateMany({
    where: {
      id,
      sentAt: null,
      jobStatus: {in: ['NotStarted', 'Failed']},
    },
    data: {
      sendAfter: null,
      jobStatus: 'Canceled',
      canceledAt,
    },
  });

  if (canceledJob.count === 0) {
    throw new Error(`Could not find NotStarted or Failed job to cancel with ID: ${id}`);
  }

  return canceledJob;
};
