import {insertTestMeetingAndCalendarEvent, insertTestTopic, testName} from '../../testing/generate-test-data';
import {setCurrentTopicForMeeting} from './set-current-topic-for-meeting';

test('SetCurrentTopicForMeeting', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

  const text = 'Test Topic for Current Topic';
  const topic = await insertTestTopic(meeting.id, text);

  const updatedMeeting = await setCurrentTopicForMeeting(meeting, topic.id);

  expect(updatedMeeting?.currentTopicId).toBe(topic.id);
});
