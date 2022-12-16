import {insertTestMeetingAndCalendarEvent, insertTestTopic, testName} from '../../testing/generate-test-data';
import {UpdateTopicRequest} from 'miter-common/SharedTypes';
import {updateTopicEndpoint} from './update-topic-endpoint';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

const testFactory = (req: Omit<UpdateTopicRequest, 'id'>, shouldThrow: boolean = false) => {
  return async () => {
    const server = mockSocketServer();
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
    const topic = await insertTestTopic(meeting.id, 'Initial Test');

    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);

    const promise = updateTopicEndpoint(server, mockWebSocket(), {id: topic.id, ...req});

    if (shouldThrow) {
      await expect(promise).rejects.toThrow();
      expect(server.broadcast).toHaveBeenCalledTimes(0);
    } else {
      await promise;

      expect(server.broadcast).toHaveBeenCalledTimes(1);
      expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'AllTopics', {
        topics: [
          {
            id: topic.id,
            meetingId: topic.meetingId,
            createdBy: null,
            text: req.text,
            order: req?.order || topic?.order,
          },
        ],
      });
    }
  };
};

test('Edit Topic text only', testFactory({text: 'text only'}));
test('Edit Topic: text and order', testFactory({text: 'text and order', order: 2}));
test('Edit Topic: empty', testFactory({} as unknown as UpdateTopicRequest, true));
test('Edit Topic: null', testFactory(null as unknown as UpdateTopicRequest, true));
