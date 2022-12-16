import {SocketServer} from '../../server-core/socket-server';
import {
  insertTestNoteAndSummaryItem,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
  insertTestSummaryItem,
} from '../../testing/generate-test-data';
import {UpdateSummaryItemRequest, UpdatedSummaryItemsResponse} from 'miter-common/SharedTypes';
import {updateSummaryItemEndpoint} from './update-summary-item-endpoint';
import {updateSummaryItem} from '../../data/notes-items/update-summary-item';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

const setupTest = async () => {
  const server = mockSocketServer();
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, testName());
  return {server, meeting, summaryItem};
};

const executeBroadcastTest = async (
  server: SocketServer,
  meetingId: string,
  req: UpdateSummaryItemRequest,
  payload: UpdatedSummaryItemsResponse,
  expectNote: boolean
) => {
  (server.getClientChannel as jest.Mock).mockReturnValue(meetingId);
  await updateSummaryItemEndpoint(server, mockWebSocket(), req);

  expect(server.broadcast).toHaveBeenCalledTimes(expectNote ? 2 : 1);
  expect(server.broadcast).toHaveBeenNthCalledWith(1, meetingId, 'UpdatedSummaryItems', payload);
};

const executeSendTest = async (
  server: SocketServer,
  req: UpdateSummaryItemRequest,
  payload: UpdatedSummaryItemsResponse
) => {
  (server.getClientChannel as jest.Mock).mockReturnValue(null);
  const client = mockWebSocket();
  await updateSummaryItemEndpoint(server, client, req);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'UpdatedSummaryItems', payload);
};

describe('updateSummaryItemEndpoint', () => {
  it('should broadcast changes to item text', async () => {
    const editedText = `Edited text - ${testName()}`;
    const {server, meeting, summaryItem} = await setupTest();
    const req: UpdateSummaryItemRequest = {id: summaryItem.id, itemText: editedText};
    await executeBroadcastTest(server, meeting.id, req, {changed: [{...summaryItem, itemText: editedText}]}, true);
  });

  it('should broadcast changes to item topic', async () => {
    const {server, meeting, summaryItem} = await setupTest();
    const topic = await insertTestTopic(meeting.id, testName());
    const req: UpdateSummaryItemRequest = {id: summaryItem.id, topicId: topic.id};
    await executeBroadcastTest(server, meeting.id, req, {changed: [{...summaryItem, topicId: topic.id}]}, true);
  });

  it('should broadcast removal of item topic', async () => {
    const {server, meeting, summaryItem} = await setupTest();
    const topic = await insertTestTopic(meeting.id, testName());

    const preReq: UpdateSummaryItemRequest = {id: summaryItem.id, topicId: topic.id};
    const {summaryItem: preEdit} = await updateSummaryItem(preReq);
    expect(preEdit.topicId).toEqual(topic.id);

    const req: UpdateSummaryItemRequest = {id: summaryItem.id, topicId: null};
    await executeBroadcastTest(server, meeting.id, req, {changed: [{...summaryItem, topicId: null}]}, true);
  });

  it('Should send changes to item edited outside a meeting', async () => {
    const editedText = `Edited text - ${testName()}`;
    const {server, meeting: _, summaryItem} = await setupTest();
    const req: UpdateSummaryItemRequest = {id: summaryItem.id, itemText: editedText};
    await executeSendTest(server, req, {changed: [{...summaryItem, itemText: editedText}]});
  });

  it('Should not broadcast a note for a standalone summary item', async () => {
    const editedText = `Edited text - ${testName()}`;
    const {server, meeting, summaryItem: _} = await setupTest();
    const summaryItem = await insertTestSummaryItem(meeting.id, testName());
    const req: UpdateSummaryItemRequest = {id: summaryItem.id, itemText: editedText};
    await executeBroadcastTest(server, meeting.id, req, {changed: [{...summaryItem, itemText: editedText}]}, false);
  });
});
