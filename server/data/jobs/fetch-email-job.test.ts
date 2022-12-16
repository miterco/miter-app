import {fetchEmailJob, fetchReadyToRunEmailJobs} from './fetch-email-job';
import {EmailJobName, JobStatus, JobType} from '../../server-core/server-types';
import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {getPrismaClient} from '../prisma-client';
import {uuid} from 'miter-common/CommonUtil';

const prisma = getPrismaClient();
const jobStatus = JobStatus.NotStarted;
const jobType = JobType.Automated;
const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1580';

const getTestEmailJobName = () => `FakeEmailJobName ${uuid()}` as EmailJobName;

describe('fetchJobEmail', () => {
  it('should not find any jobs ready to run before we have one', async () => {
    const jobName = getTestEmailJobName();
    const jobsReadyToRun = await fetchReadyToRunEmailJobs(jobName);
    expect(jobsReadyToRun?.length).toBe(0);
  });

  it('should fetch a preexisting job from the database', async () => {
    const jobId = '8c43f9e5-e8df-4814-afbc-d5ec50294a29';
    const fetchedJob = await fetchEmailJob(jobId);

    expect(fetchedJob?.id).toBe(jobId);
    expect(fetchedJob?.jobName).toBe(EmailJobName.SummaryEmail);
    // TODO when we write tests that actually complete jobs, this check may fail.
    expect(fetchedJob?.jobStatus).toBe(jobStatus);
    expect(fetchedJob?.jobType).toBe(jobType);
    expect(fetchedJob?.meetingId).toBe(meetingId);
  });

  it('should fetch a job we created', async () => {
    const jobName = getTestEmailJobName();
    const jobId = uuid();

    await prisma.jobsEmail.create({
      data: {
        id: jobId,
        jobName,
        jobType,
        jobStatus,
        sendAfter: new Date('2021-05-10 15:00:00'),
        meetingId,
        jobRecipients: [{email: 'sampleemaildf@test.miter.co', name: 'Darwin'}, {email: 'sampleemailc@test.miter.co'}],
      },
    });

    const fetchedJob = await fetchEmailJob(jobId);

    expect(fetchedJob?.id).toBe(jobId);
    expect(fetchedJob?.jobName).toBe(jobName);
    expect(fetchedJob?.jobStatus).toBe(jobStatus);
    expect(fetchedJob?.jobType).toBe(jobType);
    expect(fetchedJob?.meetingId).toBe(meetingId);
  });

  it('should fetch email jobs ready to run', async () => {
    const jobName = getTestEmailJobName();
    const currentTime = new Date();
    const jobId = uuid();

    // Create a job that's ready to run
    await prisma.jobsEmail.create({
      data: {
        id: jobId,
        jobName,
        jobType,
        jobStatus,
        sendAfter: new Date('2021-05-10 15:00:00'),
        meetingId,
        jobRecipients: [{email: 'sampleemaildf@test.miter.co', name: 'Darwin'}, {email: 'sampleemailc@test.miter.co'}],
      },
    });

    // Creating a second job that should NOT be ready to run yet
    await prisma.jobsEmail.create({
      data: {
        id: uuid(),
        jobName,
        jobType,
        jobStatus,
        sendAfter: new Date(Date.now() + 1000 * 60 * 5),
        meetingId: (await insertTestMeeting(testName())).id,
        jobRecipients: [{email: 'sampleemaildf@test.miter.co', name: 'Darwin'}, {email: 'sampleemailc@test.miter.co'}],
      },
    });

    const jobsReadyToRun = await fetchReadyToRunEmailJobs(jobName);

    expect(jobsReadyToRun?.length).toBe(1);
    expect(Number(jobsReadyToRun[0].sendAfter)).toBeLessThan(Number(currentTime));
    expect(jobsReadyToRun[0].jobStatus).toBe('NotStarted');
    expect(jobsReadyToRun[0].id).toBe(jobId);
  });
});
