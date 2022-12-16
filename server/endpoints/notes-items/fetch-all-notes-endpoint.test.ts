import { SocketServer, SocketUser } from '../../server-core/socket-server';
import { insertBaseTestDataForNotesOrItemsEndpoint, insertTestNote } from '../../testing/generate-test-data';
import { fetchAllNotesEndpoint } from './fetch-all-notes-endpoint';
import { Note } from 'miter-common/SharedTypes';
import { mockSocketServer, mockWebSocket } from '../../data/test-util';
import WebSocket from 'ws';

let server: SocketServer;
let client: WebSocket;

beforeEach(() => {
  server = mockSocketServer();
  client = mockWebSocket();
});

test('FetchAllNotes Endpoint - 1 Note', async () => {
  const { meeting, user } = await insertBaseTestDataForNotesOrItemsEndpoint(true);

  const userId = user.id;
  const socketUser: SocketUser = { userId };

  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  const notes: Note[] = [await insertTestNote(meeting.id, 'Test Note 1')];

  const req = { id: meeting.id };

  await fetchAllNotesEndpoint(server, client, req);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'AllNotes', { notes });
});

test('FetchAllNotes Endpoint - 2 Note', async () => {
  const { meeting, user } = await insertBaseTestDataForNotesOrItemsEndpoint(true);

  const userId = user.id;
  const socketUser: SocketUser = { userId };

  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  const notes: Note[] =
    [await insertTestNote(meeting.id, 'Test Note 1'),
    await insertTestNote(meeting.id, 'Test Note 2')];

  const req = {};

  await fetchAllNotesEndpoint(server, client, { req });

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'AllNotes', { notes });
});