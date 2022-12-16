import { insertBulkTestCalendarEvents, testName, TestUserId } from '../../testing/generate-test-data';
import { v4 as uuid } from 'uuid';
import { fetchMeeting } from '../../data/meetings-events/fetch-meeting';
import { fetchPriorMeetingsEndpoint } from './fetch-prior-meeting-list-endpoint';
import { mockSocketServer, mockWebSocket } from '../../data/test-util';

const testFactory = (signedIn: boolean) => async () => {
  const server = mockSocketServer();
  const requestId = uuid();
  const client = mockWebSocket();

  const newCalendarEvents = await insertBulkTestCalendarEvents(testName(), 3);
  if (!newCalendarEvents) throw 'Here for TS reasons';
  expect(newCalendarEvents?.length).toBe(3);

  const thisWeekMeetingId = newCalendarEvents[2].meetingId;
  const thisWeekMeeting = await fetchMeeting(thisWeekMeetingId);

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(thisWeekMeeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce({ userId: signedIn ? TestUserId : null });
  await fetchPriorMeetingsEndpoint(server, client, {}, requestId);

  const meeting1 = await fetchMeeting(newCalendarEvents[0].meetingId);
  const meeting2 = await fetchMeeting(newCalendarEvents[1].meetingId);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'DirectResponse', { meetings: signedIn ? [expect.objectContaining({ ...meeting2 }), expect.objectContaining({ ...meeting1 })] : [] }, requestId);
};


test('Get Prior Meetings List - Signed In', testFactory(true));
test('Get Prior Meetings List - Not Signed In', testFactory(false));