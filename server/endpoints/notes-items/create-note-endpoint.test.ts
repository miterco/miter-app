import {SocketServer, SocketUser} from '../../server-core/socket-server';
import {CreateNoteRequest} from 'miter-common/SharedTypes';
import {createNoteEndpoint} from './create-note-endpoint';
import {fetchAllNotes} from '../../data/notes-items/fetch-all-notes';
import {fetchItemAssociatedPeopleByNote} from '../../data/people/fetch-item-associated-people';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertBaseTestDataForNotesOrItemsEndpoint} from '../../testing/generate-test-data';
import {fetchSummaryItemByNote} from '../../data/notes-items/fetch-summary-item-by-note';

let server: SocketServer;

beforeEach(() => {
  server = mockSocketServer();
});

const testFactory = (opts: {
  req: CreateNoteRequest;
  setCurrentTopic?: boolean;
  shouldThrow?: boolean;
  shouldCreateSummaryItem?: boolean;
}) => {
  const {req, setCurrentTopic, shouldThrow, shouldCreateSummaryItem} = opts;

  return async () => {
    // Need a meeting to edit, and a calendarEvent on which to base it
    const {meeting, user} = await insertBaseTestDataForNotesOrItemsEndpoint(setCurrentTopic);
    const socketUser: SocketUser = {userId: user.id};

    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

    const promise = createNoteEndpoint(server, mockWebSocket(), req);

    if (shouldThrow) {
      await expect(promise).rejects.toThrow();
      expect(server.broadcast).toHaveBeenCalledTimes(0);
    } else {
      await promise;
      const notes = await fetchAllNotes(meeting.id);
      if (!notes || !notes[0]) throw `Failed to create note for meeting ${meeting.id}`;

      if (setCurrentTopic) {
        expect(notes[0].topicId).toBeTruthy();
      } else {
        expect(notes[0].topicId).toBeFalsy();
      }

      expect(server.broadcast).toHaveBeenCalledTimes(shouldCreateSummaryItem ? 2 : 1);
      expect(server.broadcast).toHaveBeenNthCalledWith(1, meeting.id, 'UpdatedNotes', {created: [notes[0]]});
      if (shouldCreateSummaryItem) {
        const summaryItem = await fetchSummaryItemByNote(notes[0].id);
        if (!summaryItem) throw new Error('Failed to create summary item');
        expect(server.broadcast).toHaveBeenNthCalledWith(2, meeting.id, 'UpdatedSummaryItems', {
          created: [summaryItem],
        });
      }
    }
  };
};

describe('createNoteEndpoint', () => {
  it(
    'should create a simple note with some text',
    testFactory({req: {note: {itemText: 'text only', targetDate: null}}})
  );

  it(
    'should create a note that captures the current topic',
    testFactory({req: {note: {itemText: 'text only', targetDate: null}}, setCurrentTopic: true})
  );

  it(
    'should create a pinned note with summary item',
    testFactory({
      req: {note: {itemText: 'text only', itemType: 'Decision', targetDate: null}},
      shouldCreateSummaryItem: true,
    })
  );

  it(
    'should create an auto-pinned note with summary item',
    testFactory({
      req: {note: {itemText: 'sampleemaildf@test.miter.co should do something', targetDate: null}},
      setCurrentTopic: true,
      shouldCreateSummaryItem: true,
    })
  );

  it('should create a note with an associated person', async () => {
    const personId = '9f2876c0-2ee9-490e-b929-d60b902d0106';

    const {meeting, user} = await insertBaseTestDataForNotesOrItemsEndpoint();
    const req = {note: {itemText: 'text only sampleemaildw@test.miter.co', targetDate: null}};

    const socketUser: SocketUser = {userId: user.id};

    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

    const promise = createNoteEndpoint(server, mockWebSocket(), req);

    await promise;
    const notes = await fetchAllNotes(meeting.id);
    if (!notes || !notes[0]) throw `Note not found for Meeting: ${meeting.id}`;

    const itemPeople = await fetchItemAssociatedPeopleByNote(notes[0].id);
    expect(itemPeople).toHaveLength(2);
    expect(itemPeople[0].personId).toBe(personId);
    expect(itemPeople[1].personId).toBe(user.personId);

    expect(server.broadcast).toHaveBeenCalledTimes(1);
    expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedNotes', {created: [notes[0]]});
  });
});
