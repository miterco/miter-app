import {insertTestMeetingAndCalendarEvent, insertTestUser, testName} from '../../testing/generate-test-data';
import {createTopic} from './create-topic';

test('createTopic with Order', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const text = 'Test Topic';
  const order = 3.2;

  const topic = await createTopic({
    meetingId: meeting.id,
    text,
    order,
  });
  if (!topic) throw 'Topic not created';

  expect(topic.order).toBe(order);
  expect(topic.meetingId).toBe(meeting.id);
  expect(topic.text).toBe(text);
});

test('createTopic - No Order', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const text = 'Test Topic';

  const topic = await createTopic({
    meetingId: meeting.id,
    text,
  });
  if (!topic) throw 'Topic not created';

  expect(topic.order).toBeTruthy();
  expect(topic.meetingId).toBe(meeting.id);
  expect(topic.text).toBe(text);
});

test('createTopic - non-null createdBy', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const text = 'Test Topic';

  const userId = (await insertTestUser(testName())).id;

  const topic = await createTopic({
    meetingId: meeting.id,
    text,
    createdBy: userId,
  });
  if (!topic) throw 'Topic not created';

  expect(topic.order).toBeTruthy();
  expect(topic.meetingId).toBe(meeting.id);
  expect(topic.text).toBe(text);
  expect(topic.createdBy).toBe(userId);
});
