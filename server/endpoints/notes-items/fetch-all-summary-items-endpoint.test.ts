import {SocketServer, SocketUser} from '../../server-core/socket-server';
import {
  insertBaseTestDataForNotesOrItemsEndpoint,
  insertTestNoteAndSummaryItem,
} from '../../testing/generate-test-data';
import WebSocket from 'ws';
import {SummaryItem} from 'miter-common/SharedTypes';
import {fetchAllSummaryItemsEndpoint} from './fetch-all-summary-items-endpoint';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

let server: SocketServer;
let client: WebSocket;

beforeEach(() => {
  server = mockSocketServer();
  client = mockWebSocket();
});

test('fetchAllSummaryItems Endpoint - 1 Summary Item', async () => {
  const {meeting, user} = await insertBaseTestDataForNotesOrItemsEndpoint(true);

  const userId = user.id;
  const socketUser: SocketUser = {userId};

  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValue(socketUser);

  const summaryItems: SummaryItem[] = [(await insertTestNoteAndSummaryItem(meeting.id, 'Test Note 1')).summaryItem];

  const req = {id: meeting.id};

  await fetchAllSummaryItemsEndpoint(server, client, req);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'AllSummaryItems', {summaryItems});
});

test('fetchAllSummaryItems Endpoint - 2 Summary Items', async () => {
  const {meeting, user} = await insertBaseTestDataForNotesOrItemsEndpoint(true);

  const userId = user.id;
  const socketUser: SocketUser = {userId};

  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValue(socketUser);

  const summaryItems: SummaryItem[] = [
    (await insertTestNoteAndSummaryItem(meeting.id, 'Test Note 1')).summaryItem,
    (await insertTestNoteAndSummaryItem(meeting.id, 'Test Note 2')).summaryItem,
  ];

  const req = {};

  await fetchAllSummaryItemsEndpoint(server, client, {req});

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'AllSummaryItems', {summaryItems});
});
