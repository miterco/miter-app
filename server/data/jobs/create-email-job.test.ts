import {createAutomatedEmailJob, createManualEmailJob} from './create-email-job';
import {
  insertTestMeeting,
  insertTestMeetingAndCalendarEvent,
  testEmailRecipientList,
  testName,
} from '../../testing/generate-test-data';
import {fetchEmailJobsForMeeting} from './fetch-email-job';
import {completeEmailJob} from './update-email-job';
import {EmailJobName, JobStatus, JobType} from '../../server-core/server-types';

const TestRecipients = testEmailRecipientList;

describe('createAutomatedEmailJob', () => {
  it('should create a simple summary-email job', async () => {
    const sendAfter = new Date();
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

    await createAutomatedEmailJob({
      jobName: EmailJobName.SummaryEmail,
      meetingId: meeting.id,
      sendAfter,
      jobRecipients: testEmailRecipientList,
    });

    const jobsForMeeting = await fetchEmailJobsForMeeting(meeting.id);
    expect(jobsForMeeting).toHaveLength(1);

    const job = jobsForMeeting[0];
    expect(job.jobName).toBe(EmailJobName.SummaryEmail);
    expect(job.jobStatus).toBe('NotStarted');
    expect(job.jobType).toBe(JobType.Automated);
    expect(job.meetingId).toBe(meeting.id);
    expect(job.jobRecipients).toEqual(testEmailRecipientList);
  });

  it("should do nothing if there's an existing completed job", async () => {
    const sendAfter = new Date();
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

    await createAutomatedEmailJob({
      jobName: EmailJobName.SummaryEmail,
      meetingId: meeting.id,
      sendAfter,
      jobRecipients: testEmailRecipientList,
    });
    const earlierJob = (await fetchEmailJobsForMeeting(meeting.id))[0];
    await completeEmailJob(earlierJob.id, true);

    await createAutomatedEmailJob({
      jobName: EmailJobName.SummaryEmail,
      meetingId: meeting.id,
      sendAfter,
      jobRecipients: testEmailRecipientList,
    });

    const jobsForMeeting = await fetchEmailJobsForMeeting(meeting.id);
    expect(jobsForMeeting).toHaveLength(1);

    const job = jobsForMeeting[0];
    expect(job.jobStatus).toBe(JobStatus.Completed);
    expect(job.id).toBe(earlierJob.id);
  });

  it("should do nothing if there's an existing unstarted job", async () => {
    const sendAfter = new Date();
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

    await createAutomatedEmailJob({
      jobName: EmailJobName.SummaryEmail,
      meetingId: meeting.id,
      sendAfter,
      jobRecipients: testEmailRecipientList,
    });
    const earlierJob = (await fetchEmailJobsForMeeting(meeting.id))[0];

    await createAutomatedEmailJob({
      jobName: EmailJobName.SummaryEmail,
      meetingId: meeting.id,
      sendAfter,
      jobRecipients: testEmailRecipientList,
    });

    const jobsForMeeting = await fetchEmailJobsForMeeting(meeting.id);
    expect(jobsForMeeting).toHaveLength(1);

    const job = jobsForMeeting[0];
    expect(job.jobStatus).toBe(JobStatus.NotStarted);
    expect(job.id).toBe(earlierJob.id);
  });
});

// The tests below are moved/adapted from the earlier functions we have that would update OR complete a job
describe('createManualEmailJob', () => {
  it('should create a manual, completed job', async () => {
    const meeting = await insertTestMeeting(testName());

    const job = await createManualEmailJob({
      meetingId: meeting.id,
      jobName: EmailJobName.SummaryEmail,
      jobStatus: JobStatus.Completed,
      jobRecipients: TestRecipients,
    });

    expect(job?.jobStatus).toBe(JobStatus.Completed);
    expect(job?.jobType).toBe(JobType.Manual);
    expect(job?.meetingId).toBe(meeting.id);
    expect(job?.sentAt).toBeTruthy();
    expect(job?.failedAt).toBeFalsy();
    expect(job?.canceledAt).toBeFalsy();
  });

  it('should create a manual, failed job', async () => {
    const meeting = await insertTestMeeting(testName());
    const job = await createManualEmailJob({
      meetingId: meeting.id,
      jobName: EmailJobName.SummaryEmail,
      jobRecipients: TestRecipients,
      jobStatus: JobStatus.Failed,
    });

    expect(job?.jobStatus).toBe(JobStatus.Failed);
    expect(job?.jobType).toBe(JobType.Manual);
    expect(job?.sentAt).toBeFalsy();
    expect(job?.failedAt).toBeTruthy();
    expect(job?.canceledAt).toBeFalsy();
  });
});
