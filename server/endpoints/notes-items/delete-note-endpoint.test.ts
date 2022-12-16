import { SocketServer, SocketUser } from '../../server-core/socket-server';
import { insertBaseTestDataForNotesOrItemsEndpoint, insertTestNote } from '../../testing/generate-test-data';
import { deleteNoteEndpoint } from './delete-note-endpoint';
import { fetchAllNotes } from '../../data/notes-items/fetch-all-notes';
import { mockSocketServer, mockWebSocket } from '../../data/test-util';

let server: SocketServer;

beforeEach(() => {
  server = mockSocketServer();
});

test('deleteNoteEndpoint - 1 Note, Delete 1', async () => {
  const { meeting, user } = await insertBaseTestDataForNotesOrItemsEndpoint(true);

  const userId = user.id;
  const socketUser: SocketUser = { userId };

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  const note1 = await insertTestNote(meeting.id, 'Test Note 1');

  const req = { id: note1.id };

  await deleteNoteEndpoint(server, mockWebSocket(), req);

  expect(server.broadcast).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedNotes', { deleted: [{ id: note1.id }] });

  const remainingNote = await fetchAllNotes(meeting.id);
  expect(remainingNote).toHaveLength(0);
});

test('deleteNoteEndpoint - 2 Notes, Delete 1', async () => {
  const { meeting, user } = await insertBaseTestDataForNotesOrItemsEndpoint(true);

  const userId = user.id;
  const socketUser: SocketUser = { userId };

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

  const note1 = await insertTestNote(meeting.id, 'Test Note 1');
  const note2 = await insertTestNote(meeting.id, 'Test Note 2');

  const req = { id: note1.id };

  await deleteNoteEndpoint(server, mockWebSocket(), req);

  expect(server.broadcast).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedNotes', { deleted: [{ id: note1.id }] });

  const remainingNote = await fetchAllNotes(meeting.id);
  expect(remainingNote).toHaveLength(1);
  expect(remainingNote[0].id).toBe(note2.id);
});