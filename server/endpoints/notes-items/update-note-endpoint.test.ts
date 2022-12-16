import {SocketServer} from '../../server-core/socket-server';
import {
  insertTestNote,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {
  UpdateNoteRequest,
  Meeting,
  Note,
  UpdatedNotesResponse,
  UpdatedSummaryItemsResponse,
} from 'miter-common/SharedTypes';
import {updateNoteEndpoint} from './update-note-endpoint';
import {updateNote} from '../../data/notes-items/update-note';
import {getDateAtMidnightUTC} from '../../server-core/server-util';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {uuid} from 'miter-common/CommonUtil';
import {fetchSummaryItemByNote} from '../../data/notes-items/fetch-summary-item-by-note';

const setupTest = async (additionalFields?: Partial<Note>) => {
  const server = mockSocketServer();
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const note = await insertTestNote(meeting.id, `test note - ${testName()}`, additionalFields);

  return {note, server, meeting};
};

const executeTest = async (opts: {
  server: SocketServer;
  meeting: Meeting;
  req: UpdateNoteRequest;
  broadcastPayload: UpdatedNotesResponse;
  summaryItemBroadcast?: UpdatedSummaryItemsResponse;
}) => {
  const {server, meeting, req, broadcastPayload, summaryItemBroadcast} = opts;
  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  await updateNoteEndpoint(server, mockWebSocket(), req);

  expect(server.broadcast).toHaveBeenCalledTimes(summaryItemBroadcast ? 2 : 1);
  expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedNotes', broadcastPayload);
  if (summaryItemBroadcast) {
    expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedSummaryItems', summaryItemBroadcast);
  }
};

describe('updateNoteEndpoint', () => {
  it('should broadcast updated text back to meeting', async () => {
    const updatedText = `Updated note text - ${testName()}`;
    const {note, server, meeting} = await setupTest();
    const req: UpdateNoteRequest = {id: note.id, itemText: updatedText};
    await executeTest({server, meeting, req, broadcastPayload: {changed: [{...note, itemText: updatedText}]}});
  });

  it('should broadcast updated target date', async () => {
    const targetDate = new Date();
    const {note, server, meeting} = await setupTest();
    const req: UpdateNoteRequest = {id: note.id, targetDate};
    await executeTest({
      server,
      meeting,
      req,
      broadcastPayload: {changed: [{...note, targetDate: getDateAtMidnightUTC(targetDate)}]},
    });
  });

  it('should broadcast changed topic', async () => {
    const {note, server, meeting} = await setupTest();

    const topic = await insertTestTopic(meeting.id, 'Initial Test');
    const topicId = topic.id;

    const req: UpdateNoteRequest = {id: note.id, topicId};
    await executeTest({server, meeting, req, broadcastPayload: {changed: [{...note, topicId}]}});
  });

  it('should broadcast removed topic for note', async () => {
    const {note, server, meeting} = await setupTest();

    const topic = await insertTestTopic(meeting.id, 'Initial Test');
    const topicId = topic.id;

    await updateNote({id: note.id, topicId});

    const req: UpdateNoteRequest = {id: note.id, topicId: null};
    await executeTest({server, meeting, req, broadcastPayload: {changed: [{...note, topicId: null}]}});
  });

  it('should broadcast note and preexisting summary item for changed text', async () => {
    const {note, server, meeting} = await setupTest({itemType: 'Decision'});
    const summaryItem = await fetchSummaryItemByNote(note.id);
    if (!summaryItem) throw new Error('Failed to find note-associated summary item.');

    const itemText = `${testName()} ${uuid()}`;
    await executeTest({
      server,
      meeting,
      req: {id: note.id, itemText},
      broadcastPayload: {changed: [{...note, itemText}]},
      summaryItemBroadcast: {changed: [{...summaryItem, itemText}]},
    });
  });

  it.todo('test for date-parsing functionality');
});
