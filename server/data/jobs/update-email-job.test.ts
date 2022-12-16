import {fetchEmailJob} from './fetch-email-job';
import {cancelEmailJob, completeEmailJob} from './update-email-job';
import {insertTestAutomatedEmailJob} from '../../testing/generate-test-data';
import {JobStatus} from '../../server-core/server-types';

describe('completeEmailJob', () => {
  it('should complete an existing automated job', async () => {
    const job = await insertTestAutomatedEmailJob();
    const updatedJob = await completeEmailJob(job.id, true);
    expect(updatedJob?.jobStatus).toBe(JobStatus.Completed);
    expect(updatedJob?.sentAt).toBeTruthy();
    expect(updatedJob?.failedAt).toBeFalsy();
    expect(updatedJob?.canceledAt).toBeFalsy();
  });

  it('should fail an existing automated job', async () => {
    const job = await insertTestAutomatedEmailJob();
    const updatedJob = await completeEmailJob(job.id, false);
    expect(updatedJob?.jobStatus).toBe(JobStatus.Failed);
    expect(updatedJob?.sentAt).toBeFalsy();
    expect(updatedJob?.failedAt).toBeTruthy();
    expect(updatedJob?.canceledAt).toBeFalsy();
  });
});

describe('cancelEmailJob', () => {
  it('should cancel an existing automated job', async () => {
    const job = await insertTestAutomatedEmailJob();

    await cancelEmailJob(job.id);
    const fetchedCanceledJob = await fetchEmailJob(job.id);

    expect(fetchedCanceledJob?.jobStatus).toBe(JobStatus.Canceled);
    expect(fetchedCanceledJob?.sentAt).toBeFalsy();
    expect(fetchedCanceledJob?.failedAt).toBeFalsy();
    expect(fetchedCanceledJob?.canceledAt).toBeTruthy();
  });
});
