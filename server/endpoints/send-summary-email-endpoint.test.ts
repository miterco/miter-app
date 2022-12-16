import {
  insertTestMeetingAndCalendarEvent,
  insertTestUser,
  testEmailRecipientList,
  testName,
} from '../testing/generate-test-data';
import sendSummaryEmailEndpoint from './send-summary-email-endpoint';
import {v4 as uuid} from 'uuid';
import {SendSummaryEmailRequest} from 'miter-common/SharedTypes';
import {mockSocketServer, mockWebSocket} from '../data/test-util';
import {fetchEmailJobsForMeeting} from '../data/jobs/fetch-email-job';
import {EmailJobName} from '../server-core/server-types';

describe('sendSummaryEmailEndpoint', () => {
  const testCore = async (withUser: boolean) => {
    const server = mockSocketServer();

    // Need a meeting to edit, and a cal event on which to base it
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

    const client = mockWebSocket();
    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);

    const user = withUser ? await insertTestUser(testName()) : null;
    withUser && (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId: user?.id});

    const reqId = uuid();
    const req: SendSummaryEmailRequest = {recipients: testEmailRecipientList};
    await sendSummaryEmailEndpoint(server, client, req, reqId);

    expect(server.send).toHaveBeenCalledTimes(1);
    expect(server.send).toHaveBeenCalledWith(client, 'DirectResponse', {}, reqId);

    const job = (await fetchEmailJobsForMeeting(meeting.id))[0];
    expect(job.meetingId).toBe(meeting.id);
    expect(job.jobName).toBe(EmailJobName.SummaryEmail);
    expect(job.jobRecipients).toEqual(testEmailRecipientList);
    expect(job.creatorId).toEqual(withUser ? user?.id : null);
  };

  it('should succeed given valid input for a logged-in user', async () => await testCore(true));
  it('should succeed given valid input for a logged-out user', async () => await testCore(false));

  it("should throw if the input doesn't validate", async () => {
    // Tests for Joi() validators...maybe remove eventually but right now I'm still getting used to them...
    const server = mockSocketServer();

    // Need a meeting to edit, and a cal event on which to base it
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

    const client = mockWebSocket();
    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    const reqId = uuid();

    await expect(sendSummaryEmailEndpoint(server, client, {}, reqId)).rejects.toThrow();
    await expect(sendSummaryEmailEndpoint(server, client, {recipients: []}, reqId)).rejects.toThrow();
    await expect(sendSummaryEmailEndpoint(server, client, {recipients: [{name: 'Hi'}]}, reqId)).rejects.toThrow();
    await expect(
      sendSummaryEmailEndpoint(server, client, {recipients: [{name: 'Hi', email: 'There'}]}, reqId)
    ).rejects.toThrow();
    await expect(
      sendSummaryEmailEndpoint(server, client, {recipients: [{name: 'Hi', email: 'darwin@miter'}]}, reqId)
    ).rejects.toThrow();
    await expect(sendSummaryEmailEndpoint(server, client, {recipients: 'hello there'}, reqId)).rejects.toThrow();
    await expect(sendSummaryEmailEndpoint(server, client, {hi: 3}, reqId)).rejects.toThrow();
  });
});
