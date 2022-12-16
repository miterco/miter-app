import {insertTestMeetingAndCalendarEvent, insertTestTopic, testName} from '../../testing/generate-test-data';
import {removeCurrentTopicFromMeeting} from './remove-current-topic-from-meeting';
import {setCurrentTopicForMeeting} from './set-current-topic-for-meeting';

test('RemoveCurrentTopicFromMeeting', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

  const text = 'Test Topic for Current Topic';
  const topic = await insertTestTopic(meeting.id, text);

  const updatedMeeting = await setCurrentTopicForMeeting(meeting, topic.id);
  expect(updatedMeeting?.currentTopicId).toBe(topic.id);

  const updatedMeetingNoTopic = await removeCurrentTopicFromMeeting(meeting);
  expect(updatedMeetingNoTopic?.currentTopicId).toBeFalsy();
});
