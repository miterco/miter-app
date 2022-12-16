import {JobStatus} from '../../server-core/server-types';
import {insertTestAutomatedEmailJob, insertTestMeeting, testName} from '../../testing/generate-test-data';
import {DelayMinutes} from './email-job-util';
import {fetchEmailJob} from './fetch-email-job';
import {cancelSummaryEmailJobsForMeeting, updateSummaryEmailJobsSendAfter} from './summary-email-job';

describe('cancelSummaryEmailJobsForMeeting', () => {
  it('should cancel all summary email jobs for a meeting', async () => {
    const meeting = await insertTestMeeting(testName());
    const createdJob = await insertTestAutomatedEmailJob(meeting.id);
    const createdJob2 = await insertTestAutomatedEmailJob(meeting.id);

    await cancelSummaryEmailJobsForMeeting(meeting.id);
    const fetchedCanceledJob = await fetchEmailJob(createdJob.id);
    const fetchedCanceledJob2 = await fetchEmailJob(createdJob2.id);

    expect(fetchedCanceledJob?.jobStatus).toBe(JobStatus.Canceled);
    expect(fetchedCanceledJob?.sentAt).toBeFalsy();
    expect(fetchedCanceledJob?.failedAt).toBeFalsy();
    expect(fetchedCanceledJob?.canceledAt).toBeTruthy();

    expect(fetchedCanceledJob2?.jobStatus).toBe(JobStatus.Canceled);
    expect(fetchedCanceledJob2?.sentAt).toBeFalsy();
    expect(fetchedCanceledJob2?.failedAt).toBeFalsy();
    expect(fetchedCanceledJob2?.canceledAt).toBeTruthy();
  });
});

test('Update Email Jobs (Send After) for Meeting', async () => {
  const newTime = new Date(new Date().getTime() + DelayMinutes * 60 * 1000);

  const meeting = await insertTestMeeting(testName());
  const createdJob = await insertTestAutomatedEmailJob(meeting.id);
  const createdJob2 = await insertTestAutomatedEmailJob(meeting.id);

  await updateSummaryEmailJobsSendAfter(meeting.id, newTime);
  const fetchUpdatedJob = await fetchEmailJob(createdJob.id);
  const fetchUpdatedJob2 = await fetchEmailJob(createdJob2.id);

  expect(fetchUpdatedJob?.sendAfter).toEqual(newTime);
  expect(fetchUpdatedJob2?.sendAfter).toEqual(newTime);
});
