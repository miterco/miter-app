import { SocketServer } from '../../server-core/socket-server';
import { insertBulkTestCalendarEvents, insertTestMeetingAndCalendarEvent, insertTestTopic, insertTestUser, testName } from '../../testing/generate-test-data';
import { fetchAllTopicsForMeeting } from '../../data/topics/fetch-all-topics';
import { fetchMeeting } from '../../data/meetings-events/fetch-meeting';
import { copyPriorTopicsEndpoint } from './copy-prior-topics-endpoint';
import { mockSocketServer, mockWebSocket } from '../../data/test-util';

let server: SocketServer;
const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';


beforeEach(() => {
  server = mockSocketServer();
});


test('Copy Topics From Prior Meeting - Topics Exist', async () => {
  const newCalendarEvents = await insertBulkTestCalendarEvents(testName(), 5);
  if (!newCalendarEvents) throw 'Here for TS reasons';
  expect(newCalendarEvents?.length).toBe(5);

  const lastWeekMeetingId = newCalendarEvents[2].meetingId;
  const thisWeekMeeting = await fetchMeeting(newCalendarEvents[4].meetingId);

  await insertTestTopic(lastWeekMeetingId, `${testName()}Topic 1`);
  await insertTestTopic(lastWeekMeetingId, `${testName()}Topic 2`);
  await insertTestTopic(lastWeekMeetingId, `${testName()}Topic 3`);

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(thisWeekMeeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce({ userId });
  await copyPriorTopicsEndpoint(server, mockWebSocket(), {});

  const copiedTopics = await fetchAllTopicsForMeeting(thisWeekMeeting.id);
  expect(copiedTopics).toHaveLength(3);
});


test('Copy Topics From Prior Meeting - No Topics', async () => {
  const newCalendarEvents = await insertBulkTestCalendarEvents(testName(), 5);
  if (!newCalendarEvents) throw 'Here for TS reasons';
  expect(newCalendarEvents?.length).toBe(5);

  // No topics inserted
  const thisWeekMeeting = await fetchMeeting(newCalendarEvents[4].meetingId);

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(thisWeekMeeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce({ userId });
  await copyPriorTopicsEndpoint(server, mockWebSocket(), {});

  const copiedTopics = await fetchAllTopicsForMeeting(thisWeekMeeting.id);
  expect(copiedTopics).toHaveLength(0);
});