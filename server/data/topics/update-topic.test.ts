import {insertTestMeeting, insertTestTopic, testName} from '../../testing/generate-test-data';
import {updateTopic} from './update-topic';

test('UpdateTopic', async () => {
  const meeting = await insertTestMeeting(testName());
  const text = 'Test Topic for Edit';
  const topic = await insertTestTopic(meeting.id, text);
  const topic1 = {id: topic.id, order: 1, text};
  const topic2 = {id: topic.id, order: 2, text: 'newText'};

  const editedTopic1 = await updateTopic(topic1);
  if (!editedTopic1) throw 'Edit Topic 1 failed';

  expect(editedTopic1.order).toBe(topic1.order);
  expect(editedTopic1.text).toBe(topic.text);
  expect(editedTopic1.meetingId).toBe(topic.meetingId);

  const editedTopic2 = await updateTopic(topic2);
  if (!editedTopic2) throw 'Typescript';

  expect(editedTopic2.order).toBe(topic2.order);
  expect(editedTopic2.text).toBe(topic2.text);
  expect(editedTopic2.meetingId).toBe(topic.meetingId);
});
