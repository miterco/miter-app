import {
  insertBulkTestCalendarEvents,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {fetchMeeting} from './fetch-meeting';
import {fetchTopicsFromPriorMeeting} from './fetch-topics-from-prior-meeting';

test('fetchTopicFromPriorMeeting - Last Week', async () => {
  const newMeetings = await insertBulkTestCalendarEvents(testName(), 2);
  if (!newMeetings) throw 'Here for TS reasons';
  expect(newMeetings?.length).toBe(2);

  const lastWeekMeetingId = newMeetings[0].meetingId;
  const thisWeekMeeting = await fetchMeeting(newMeetings[1].meetingId);

  await insertTestTopic(lastWeekMeetingId, `${testName()}Topic 1`);
  await insertTestTopic(lastWeekMeetingId, `${testName()}Topic 2`);
  await insertTestTopic(lastWeekMeetingId, `${testName()}Topic 3`);

  const lastWeekTopics = await fetchTopicsFromPriorMeeting(thisWeekMeeting);
  expect(lastWeekTopics?.length).toBe(3);
});

test('fetchTopicFromPriorMeeting - Skip Weeks', async () => {
  const newMeetings = await insertBulkTestCalendarEvents(testName(), 5);
  if (!newMeetings) throw 'Here for TS reasons';
  expect(newMeetings?.length).toBe(5);

  const priorWeekMeetingId = newMeetings[1].meetingId;
  const thisWeekMeeting = await fetchMeeting(newMeetings[4].meetingId);

  await insertTestTopic(priorWeekMeetingId, `${testName()}Topic 1`);
  await insertTestTopic(priorWeekMeetingId, `${testName()}Topic 2`);
  await insertTestTopic(priorWeekMeetingId, `${testName()}Topic 3`);

  const priorWeekTopics = await fetchTopicsFromPriorMeeting(thisWeekMeeting);
  expect(priorWeekTopics?.length).toBe(3);
});

test('fetchTopicsFromPriorMeeting - Not a recurring series', async () => {
  const {meeting: newMeeting} = await insertTestMeetingAndCalendarEvent(testName());
  await insertTestTopic(newMeeting.id, `${testName()} Topic`);
  const priorTopics = await fetchTopicsFromPriorMeeting(newMeeting);
  expect(priorTopics?.length).toBe(0);
});
