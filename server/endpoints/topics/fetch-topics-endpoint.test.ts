import {SocketServer} from '../../server-core/socket-server';
import {
  insertBulkTestCalendarEvents,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {fetchAllTopicsEndpoint, fetchPriorTopicsEndpoint} from './fetch-topics-endpoint';
import {v4 as uuid} from 'uuid';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {fetchAllTopicsForMeeting} from '../../data/topics/fetch-all-topics';
import {TopicsResponse} from 'miter-common/SharedTypes';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

let server: SocketServer;
const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';

beforeEach(() => {
  server = mockSocketServer();
});

test('fetchAllTopicsEndpoint - no topics', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const client = mockWebSocket();
  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  await fetchAllTopicsEndpoint(server, client, null);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'AllTopics', {topics: []});
});

test('fetchAllTopicsEndpoint - has topics', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const topic1 = await insertTestTopic(meeting.id, `Topic 1 - ${testName()}`);
  const topic2 = await insertTestTopic(meeting.id, `Topic 2 - ${testName()}`);

  const client = mockWebSocket();
  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  await fetchAllTopicsEndpoint(server, client, null);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'AllTopics', {topics: [topic1, topic2]});
});

test('Check For Topics From Prior Meetings', async () => {
  const requestId = uuid();
  const client = mockWebSocket();

  const newCalendarEvents = await insertBulkTestCalendarEvents(testName(), 5);
  if (!newCalendarEvents) throw 'Here for TS reasons';
  expect(newCalendarEvents?.length).toBe(5);

  const priorWeekMeetingId = newCalendarEvents[2].meetingId;
  const thisWeekMeeting = await fetchMeeting(newCalendarEvents[4].meetingId);

  await insertTestTopic(priorWeekMeetingId, `${testName()}Topic 1`);
  await insertTestTopic(priorWeekMeetingId, `${testName()}Topic 2`);
  await insertTestTopic(priorWeekMeetingId, `${testName()}Topic 3`);

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(thisWeekMeeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId});
  await fetchPriorTopicsEndpoint(server, mockWebSocket(), {}, requestId);

  const topics = await fetchAllTopicsForMeeting(priorWeekMeetingId);
  const res: TopicsResponse = {topics};

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'DirectResponse', res, requestId);
});
