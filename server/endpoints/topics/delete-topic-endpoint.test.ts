import {insertTestMeetingAndCalendarEvent, insertTestTopic, testName} from '../../testing/generate-test-data';
import {DeleteTopicRequest} from 'miter-common/SharedTypes';
import {deleteTopicEndpoint} from './delete-topic-endpoint';
import {fetchAllTopicsForMeeting} from '../../data/topics/fetch-all-topics';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

const testFactory = (_req: Omit<DeleteTopicRequest, 'id'>, shouldThrow: boolean = false) => {
  return async () => {
    const server = mockSocketServer();

    // Need a meeting to edit, and a calendarEvent on which to base it
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
    const topic = await insertTestTopic(meeting.id, 'Initial Test');

    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);

    const promise = deleteTopicEndpoint(server, mockWebSocket(), {id: topic.id});

    if (shouldThrow) {
      await expect(promise).rejects.toThrow();
      expect(server.broadcast).toHaveBeenCalledTimes(0);
    } else {
      await promise;

      const topics = await fetchAllTopicsForMeeting(meeting.id);
      expect(topics).toEqual([]);
      expect(server.broadcast).toHaveBeenCalledTimes(1);
      expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'AllTopics', {topics: []});
    }
  };
};

test('Delete Topic', testFactory({}));
