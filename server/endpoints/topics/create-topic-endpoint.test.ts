import {SocketServer} from '../../server-core/socket-server';
import {insertTestMeetingAndCalendarEvent, insertTestUser, testName} from '../../testing/generate-test-data';
import {CreateTopicRequest} from 'miter-common/SharedTypes';
import {v4 as uuid} from 'uuid';
import {Server} from 'http';
import {createTopicEndpoint} from './create-topic-endpoint';
import {fetchAllTopicsForMeeting} from '../../data/topics/fetch-all-topics';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

let server: SocketServer;

const testFactory = (req: CreateTopicRequest, opts: {shouldThrow?: boolean; populateCreatedBy?: boolean} = {}) => {
  return async () => {
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
    const userId = opts.populateCreatedBy ? (await insertTestUser(testName())).id : null;

    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId});

    const promise = createTopicEndpoint(server, mockWebSocket(), req);

    if (opts.shouldThrow) {
      await expect(promise).rejects.toThrow();
      expect(server.broadcast).toHaveBeenCalledTimes(0);
    } else {
      await promise;
      const topics = await fetchAllTopicsForMeeting(meeting.id);
      if (!topics || !topics[0]) throw `Topics note found for Meeting: ${meeting.id}`;

      expect(server.broadcast).toHaveBeenCalledTimes(1);
      expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'AllTopics', {topics: [topics[0]]});
    }
  };
};

beforeEach(() => {
  server = mockSocketServer();
});

test('Create Topic: text only', testFactory({text: 'text only'}));
test('Create Topic: text & userId', testFactory({text: 'text only'}, {populateCreatedBy: true}));
test('Create Topic: text and order', testFactory({text: 'text and order', order: 2}));

test(
  'Create Topic: extraneous id',
  testFactory({id: uuid(), text: 'Create Topic with extra id', order: 2} as CreateTopicRequest)
);

test('Create Topic: empty', testFactory({} as unknown as CreateTopicRequest, {shouldThrow: true}));
test('Creat Topic: null', testFactory(null as unknown as CreateTopicRequest, {shouldThrow: true}));
