import {SocketServer, SocketUser} from '../../server-core/socket-server';
import {insertBaseTestDataForNotesOrItemsEndpoint, insertTestUser, testName} from '../../testing/generate-test-data';
import {CreateSummaryItemRequest} from 'miter-common/SharedTypes';
import {createSummaryItemEndpoint} from './create-summary-item-endpoint';
import {fetchAllSummaryItems} from '../../data/notes-items/fetch-all-summary-items';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {fetchTasksByPerson} from '../../data/notes-items/fetch-tasks-by-person';

describe('summaryItemEndpoint', () => {
  let server: SocketServer;

  const testFactory = (req: CreateSummaryItemRequest, setTopic: boolean = false, shouldThrow: boolean = false) => {
    return async () => {
      // Need a meeting to edit, and a calendarEvent on which to base it
      const {meeting, user, topic} = await insertBaseTestDataForNotesOrItemsEndpoint(setTopic);

      const socketUser: SocketUser = {userId: user.id};

      (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
      (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);

      const promise = createSummaryItemEndpoint(server, mockWebSocket(), {
        summaryItem: {...req.summaryItem, topicId: topic?.id},
      });

      if (shouldThrow) {
        await expect(promise).rejects.toThrow();
        expect(server.broadcast).toHaveBeenCalledTimes(0);
      } else {
        await promise;
        const summaryItems = await fetchAllSummaryItems(meeting.id);
        if (!summaryItems || !summaryItems[0]) throw `Summary Items not found for meeting ${meeting.id}`;

        if (setTopic) {
          expect(summaryItems[0].topicId).toBeTruthy();
        } else {
          expect(summaryItems[0].topicId).toBeFalsy();
        }

        expect(server.broadcast).toHaveBeenCalledTimes(1);
        expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'UpdatedSummaryItems', {created: [summaryItems[0]]});
      }
    };
  };

  beforeEach(() => {
    server = mockSocketServer();
  });

  it(
    'should create a summary item with just text',
    testFactory({summaryItem: {itemText: 'text only', targetDate: null, noteId: null, itemType: 'Decision'}})
  );

  it(
    'should create a summary item with text and a topic',
    testFactory({summaryItem: {itemText: 'text only', targetDate: null, noteId: null, itemType: 'Decision'}}, true)
  );

  it('should create a task without a meeting', async () => {
    const client = mockWebSocket();
    const user = await insertTestUser(testName());
    const socketUser: SocketUser = {userId: user.id};
    (server.getUserForClient as jest.Mock).mockReturnValueOnce(socketUser);
    const summaryItemInfo = {itemText: testName(), targetDate: null, noteId: null, itemType: 'Task'};
    await createSummaryItemEndpoint(server, client, {summaryItem: summaryItemInfo, outsideOfMeeting: true});

    const userTasks = await fetchTasksByPerson(user.personId);
    expect(userTasks).toHaveLength(1);
    expect(userTasks[0].summaryItem.itemText).toBe(summaryItemInfo.itemText);

    expect(server.send).toHaveBeenCalledTimes(1);
    expect(server.send).toHaveBeenCalledWith(client, 'UpdatedSummaryItems', {created: [userTasks[0].summaryItem]});
  });
});
