import {uuid} from 'miter-common/CommonUtil';
import {FetchTaskListRequest} from 'miter-common/SharedTypes';
import {addMeetingAttendee} from '../../data/people/add-meeting-attendee';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {SocketUser} from '../../server-core/socket-server';
import {
  insertBaseTestDataForNotesOrItemsEndpoint,
  insertTestMeetingAndCalendarEvent,
  insertTestNoteAndSummaryItem,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {fetchTasksForUserEndpoint} from './fetch-tasks-for-user-endpoint';

test('fetchTasksForUserEndpoint - 1 Task, Fetch Mine', async () => {
  const {meeting, user, topic} = await insertBaseTestDataForNotesOrItemsEndpoint(true);
  const {summaryItem: task} = await insertTestNoteAndSummaryItem(meeting.id, `${user.loginEmail}  ${testName()}`, {
    itemType: 'Task',
    topicId: topic?.id,
  });

  const server = mockSocketServer();
  const client = mockWebSocket();

  const socketUser: SocketUser = {userId: user.id};
  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  const req: FetchTaskListRequest = {filter: 'MyTasks'};
  const reqId = uuid();
  await fetchTasksForUserEndpoint(server, client, req, reqId);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(
    client,
    'DirectResponse',
    {
      summaryItems: [
        expect.objectContaining({
          summaryItem: task,
        }),
      ],
    },
    reqId
  );
});

test('fetchTasksForUserEndpoint - Fetch All', async () => {
  const {meeting, user, topic} = await insertBaseTestDataForNotesOrItemsEndpoint(true);
  await addMeetingAttendee(meeting.id, user.id);
  const {summaryItem: task} = await insertTestNoteAndSummaryItem(meeting.id, `${user.loginEmail}  ${testName()}`, {
    itemType: 'Task',
    topicId: topic?.id,
  });

  const {meeting: anotherMeeting} = await insertTestMeetingAndCalendarEvent(testName());
  await addMeetingAttendee(anotherMeeting.id, user.id);
  const anotherUser = await insertTestUser(testName());
  const {summaryItem: someoneElsesTask} = await insertTestNoteAndSummaryItem(
    anotherMeeting.id,
    `${anotherUser.loginEmail} (not the user) ${testName()}`,
    {itemType: 'Task', topicId: topic?.id}
  );

  const server = mockSocketServer();
  const client = mockWebSocket();

  const socketUser: SocketUser = {userId: user.id};
  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  const req: FetchTaskListRequest = {filter: 'MyMeetings'};
  const reqId = uuid();
  await fetchTasksForUserEndpoint(server, client, req, reqId);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(
    client,
    'DirectResponse',
    {
      summaryItems: [
        expect.objectContaining({summaryItem: task}),
        expect.objectContaining({summaryItem: someoneElsesTask}),
      ],
    },
    reqId
  );
});
