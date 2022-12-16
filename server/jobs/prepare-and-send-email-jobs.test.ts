import {EmailRecipient} from 'miter-common/SharedTypes';
import {fetchEmailJobsForMeeting} from '../data/jobs/fetch-email-job';
import {createSystemMessage} from '../data/notes-items/create-note';
import {sendEmail} from '../email/email';
import {changeMeetingPhase} from '../logic/change-meeting-phase';
import {
  delay,
  insertTestMeeting,
  insertTestNote,
  insertTestSummaryItem,
  insertTestTopic,
  testName,
} from '../testing/generate-test-data';
import {sendSummaryEmailForJob} from './prepare-and-send-email-jobs';

jest.mock('../email/email.ts', () => {
  const original = jest.requireActual('../email/email.ts');
  return {
    __esModule: true,
    ...original,
    sendEmail: jest.fn(() => true),
  };
});

describe('sendSummaryEmailForJob', () => {
  const recipients: EmailRecipient[] = [{email: 'test@test.miter.co'}];

  const testCore = async (meetingId: string, shouldHaveEmailed: boolean) => {
    await changeMeetingPhase(meetingId, 'Ended');
    await delay(300);
    const jobs = await fetchEmailJobsForMeeting(meetingId);
    expect(jobs).toHaveLength(1);
    const job = jobs[0];
    await sendSummaryEmailForJob(job.id, meetingId, recipients);
    expect(sendEmail).toHaveBeenCalledTimes(shouldHaveEmailed ? 1 : 0);
  };

  afterEach(() => {
    (sendEmail as jest.Mock).mockClear();
  });

  it('should send the summary for an Ended meeting with a pinned note', async () => {
    const meeting = await insertTestMeeting(testName());
    await insertTestNote(meeting.id, testName(), {itemType: 'Task'});
    await testCore(meeting.id, true);
  });

  it('should send the summary for an Ended meeting with only notes', async () => {
    const meeting = await insertTestMeeting(testName());
    await insertTestNote(meeting.id, testName(), {itemType: 'None'});
    await testCore(meeting.id, true);
  });

  it('should send the summary a meeting with a mix of items', async () => {
    const meeting = await insertTestMeeting(testName());
    await insertTestNote(meeting.id, testName(), {itemType: 'None'});
    await insertTestNote(meeting.id, testName(), {itemType: 'Decision'});
    await insertTestSummaryItem(meeting.id, testName(), {itemType: 'Task'});

    await testCore(meeting.id, true);
  });

  it('should not send the summary there are no notes or summary items', async () => {
    const meeting = await insertTestMeeting(testName());
    await testCore(meeting.id, false);
  });

  it('should not send the summary if the only notes are system messages', async () => {
    const meeting = await insertTestMeeting(testName());
    const topic = await insertTestTopic(meeting.id, testName());
    await createSystemMessage({
      meetingId: meeting.id,
      topicId: topic.id,
      systemMessageType: 'CurrentTopicSet',
    });

    await testCore(meeting.id, false);
  });
});
