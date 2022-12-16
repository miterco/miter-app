import {SocketServer, SocketUser} from '../../server-core/socket-server';
import {
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {setCurrentTopicForMeetingEndpoint} from './set-current-topic-for-meeting-endpoint';
import {UpdatedNotesResponse} from 'miter-common/SharedTypes';
import {fetchAllNotes} from '../../data/notes-items/fetch-all-notes';
import {setCurrentTopicForMeeting} from '../../data/topics/set-current-topic-for-meeting';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

let server: SocketServer;

beforeEach(() => {
  server = mockSocketServer();
});

test('Set Current Topic for Meeting: Add Topic', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const meetingId = meeting.id;
  const user = await insertTestUser(testName());
  const userId = user.id;

  const topic = await insertTestTopic(meeting.id, 'Initial Test');
  const topicId = topic.id;

  const socketUser: SocketUser = {userId};

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  await setCurrentTopicForMeetingEndpoint(server, mockWebSocket(), {meetingId, topicId});
  expect(server.broadcast).toHaveBeenCalledTimes(2);
  expect(server.broadcast).toHaveBeenCalledWith(meetingId, 'Meeting', {meeting: {...meeting, currentTopicId: topicId}});

  const allNotes = await fetchAllNotes(meetingId);
  if (!allNotes || allNotes.length === 0) throw 'No Notes Found';
  const systemMessage = allNotes[allNotes.length - 1];

  const resNotes: UpdatedNotesResponse = {created: [systemMessage]};

  expect(server.broadcast).toHaveBeenCalledWith(meetingId, 'UpdatedNotes', resNotes);
});

test('Set Topic for SummaryItem: Remove Topic', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const meetingId = meeting.id;
  const user = await insertTestUser(testName());
  const userId = user.id;

  const topic = await insertTestTopic(meeting.id, 'Initial Test');
  const topicId = topic.id;

  await setCurrentTopicForMeeting(meeting, topicId);

  const socketUser: SocketUser = {userId};

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meetingId);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  await setCurrentTopicForMeetingEndpoint(server, mockWebSocket(), {meetingId, topicId: null});

  expect(server.broadcast).toHaveBeenCalledTimes(2);
  expect(server.broadcast).toHaveBeenCalledWith(meetingId, 'Meeting', {meeting: {...meeting, currentTopicId: null}});

  const allNotes = await fetchAllNotes(meetingId);
  if (!allNotes || allNotes.length === 0) throw 'No Notes Found';
  const systemMessage = allNotes[allNotes.length - 1];

  const resNotes: UpdatedNotesResponse = {created: [systemMessage]};

  expect(server.broadcast).toHaveBeenCalledWith(meetingId, 'UpdatedNotes', resNotes);
});
