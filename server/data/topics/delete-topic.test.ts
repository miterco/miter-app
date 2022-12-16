import {deleteTopic} from './delete-topic';

import {
  insertTestNoteAndSummaryItem,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {fetchMeeting} from '../meetings-events/fetch-meeting';
import {updateSummaryItem} from '../notes-items/update-summary-item';
import {fetchSummaryItem} from '../notes-items/fetch-summary-item';
import {fetchTopic} from './fetch-topic';
import {setCurrentTopicForMeeting} from './set-current-topic-for-meeting';

test('deleteTopic', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const text = 'Test Topic';
  const topic = await insertTestTopic(meeting.id, text);
  const itemText = 'summary item for topic delete';

  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText);

  await updateSummaryItem({id: summaryItem.id, topicId: topic.id});
  await deleteTopic(topic.id);

  const fetchedTopic = await fetchTopic(topic.id);
  expect(fetchedTopic).toBeFalsy();

  const fetchedItem = await fetchSummaryItem(summaryItem.id);
  expect(fetchedItem?.topicId).toBeNull();
});

test('deleteTopic / currentTopic', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const text = 'Test Topic';
  const topic = await insertTestTopic(meeting.id, text);
  const itemText = 'summary item for topic delete';
  await setCurrentTopicForMeeting(meeting, topic.id);

  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText);

  await updateSummaryItem({id: summaryItem.id, topicId: topic.id});
  await deleteTopic(topic.id);

  const fetchedTopic = await fetchTopic(topic.id);
  expect(fetchedTopic).toBeFalsy();

  const fetchedMeeting = await fetchMeeting(meeting.id);
  expect(fetchedMeeting?.currentTopicId).toBeFalsy();
});
