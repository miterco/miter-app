import {
  insertTestNoteAndSummaryItem,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {fetchMeeting} from '../meetings-events/fetch-meeting';
import {updateSummaryItem} from '../notes-items/update-summary-item';
import {fetchNote} from '../notes-items/fetch-note';
import {fetchSummaryItem} from '../notes-items/fetch-summary-item';
import {removeAllNotesAndSummaryItemsFromTopic, removeCurrentTopicFromMeetingByTopic} from './remove-topic';
import {setCurrentTopicForMeeting} from './set-current-topic-for-meeting';

test('removeAllNotesAndSummaryItemsFromTopic', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

  const text = 'Test Topic for Removing';
  const topic = await insertTestTopic(meeting.id, text);
  const itemText1 = 'Test Summary Item1';
  const itemText2 = 'Test Summary Item2';
  const itemText3 = 'Test Summary Item3';

  const {summaryItem: summaryItem1} = await insertTestNoteAndSummaryItem(meeting.id, itemText1);
  const {summaryItem: summaryItem2} = await insertTestNoteAndSummaryItem(meeting.id, itemText2);
  const {summaryItem: summaryItem3} = await insertTestNoteAndSummaryItem(meeting.id, itemText3);

  if (!(summaryItem1.noteId && summaryItem2.noteId && summaryItem3.noteId)) throw 'Note creation failed';

  const {summaryItem: updatedSummaryItem1} = await updateSummaryItem({id: summaryItem1.id, topicId: topic.id});
  const {summaryItem: updatedSummaryItem2} = await updateSummaryItem({id: summaryItem2.id, topicId: topic.id});
  const {summaryItem: updatedSummaryItem3} = await updateSummaryItem({id: summaryItem3.id, topicId: topic.id});

  expect(updatedSummaryItem1?.topicId).toBe(topic.id);
  expect(updatedSummaryItem2?.topicId).toBe(topic.id);
  expect(updatedSummaryItem3?.topicId).toBe(topic.id);

  const note1 = await fetchNote(summaryItem1.noteId);
  const note2 = await fetchNote(summaryItem2.noteId);
  const note3 = await fetchNote(summaryItem3.noteId);

  expect(note1?.topicId).toBe(topic.id);
  expect(note2?.topicId).toBe(topic.id);
  expect(note3?.topicId).toBe(topic.id);

  await removeAllNotesAndSummaryItemsFromTopic(topic.id);

  const fetchedSummaryItem1 = await fetchSummaryItem(summaryItem1.id);
  const fetchedSummaryItem2 = await fetchSummaryItem(summaryItem2.id);
  const fetchedSummaryItem3 = await fetchSummaryItem(summaryItem3.id);

  expect(fetchedSummaryItem1?.topicId).toBeFalsy();
  expect(fetchedSummaryItem2?.topicId).toBeFalsy();
  expect(fetchedSummaryItem3?.topicId).toBeFalsy();

  const fetchedNote1 = await fetchNote(summaryItem1.noteId);
  const fetchedNote2 = await fetchNote(summaryItem2.noteId);
  const fetchedNote3 = await fetchNote(summaryItem3.noteId);

  expect(fetchedNote1?.topicId).toBeFalsy();
  expect(fetchedNote2?.topicId).toBeFalsy();
  expect(fetchedNote3?.topicId).toBeFalsy();
});

test('removeCurrentTopicFromMeeting', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

  const text = 'Test Topic for Removing from Meeting';
  const topic = await insertTestTopic(meeting.id, text);

  const updatedMeeting = await setCurrentTopicForMeeting(meeting, topic.id);

  expect(updatedMeeting?.currentTopicId).toBe(topic.id);

  const result = await removeCurrentTopicFromMeetingByTopic(topic.id);
  const unsetMeeting = await fetchMeeting(meeting.id);
  expect(unsetMeeting).toBeTruthy();
  expect(unsetMeeting?.currentTopicId).toBeFalsy();
});
