import {SocketUser} from '../../server-core/socket-server';
import {
  insertBaseTestDataForNotesOrItemsEndpoint,
  insertTestNoteAndSummaryItem,
  insertTestSummaryItem,
  testName,
} from '../../testing/generate-test-data';
import {deleteSummaryItemEndpoint} from './delete-summary-item-endpoint';
import {fetchAllSummaryItems} from '../../data/notes-items/fetch-all-summary-items';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {SummaryItem, UpdatedNotesResponse, UpdatedSummaryItemsResponse} from 'miter-common/SharedTypes';
import {fetchNote} from '../../data/notes-items/fetch-note';

const testFactory =
  (itemCount: number, outsideOfMeeting: boolean = false, withNote: boolean = true) =>
  async () => {
    const server = mockSocketServer();
    const client = mockWebSocket();
    const {meeting, user} = await insertBaseTestDataForNotesOrItemsEndpoint(true);
    const userId = user.id;
    const socketUser: SocketUser = {userId};

    if (outsideOfMeeting) {
      (server.getClientChannel as jest.Mock).mockReturnValueOnce(null);
    } else {
      (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    }

    (server.getClientChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

    const items: SummaryItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      const text = `${testName()} Summary Item ${i}`;
      items.push(
        withNote
          ? (await insertTestNoteAndSummaryItem(meeting.id, text)).summaryItem
          : await insertTestSummaryItem(meeting.id, text)
      );
    }
    if (!items[0]) throw new Error('Need at least one item to test');

    const req = {id: items[0].id};
    const itemResponsePayload: UpdatedSummaryItemsResponse = {deleted: [req]};

    await deleteSummaryItemEndpoint(server, client, req);

    // Let's ensure we haven't deleted the note, too.
    if (withNote) {
      if (!items[0].noteId) throw new Error("Expected summary item to have a note ID and didn't get one.");
      const note = await fetchNote(items[0].noteId);
      expect(note).toBeTruthy();
      expect(note.id).toBe(items[0].noteId);
      expect(note.itemType).toBe('None');
    } else {
      expect(items[0].noteId).toBeNull();
    }

    if (outsideOfMeeting) {
      expect(server.send).toHaveBeenCalledTimes(1);
      expect(server.send).toHaveBeenCalledWith(client, 'UpdatedSummaryItems', itemResponsePayload);
    } else {
      expect(server.broadcast).toHaveBeenCalledTimes(withNote ? 2 : 1);
      expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedSummaryItems', itemResponsePayload);
      if (withNote) {
        if (!items[0].noteId) throw new Error("Expected summary item to have an attached note and it didn't.");
        expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedNotes', {
          changed: [expect.objectContaining({id: items[0].noteId, itemType: 'None'})],
        });
      }
    }

    const remainingSummaryItems = await fetchAllSummaryItems(meeting.id);
    expect(remainingSummaryItems).toHaveLength(itemCount - 1);
    if (itemCount > 1) expect(remainingSummaryItems[0].id).toBe(items[1].id);
  };

describe('deleteSummaryItemEndpoint', () => {
  it('Should broadcast deletion of the only item in a meeting', testFactory(1));
  it('Should broadcast deletion of one item of several in a meeting', testFactory(2));
  it('Should send deletion of an item outside a meeting', testFactory(1, true));
  it('Should not broadcast note-related changes when there is no note', testFactory(1, false, true));
});
