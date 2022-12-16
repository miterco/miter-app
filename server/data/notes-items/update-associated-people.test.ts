import {insertTestMeeting, insertTestNoteAndSummaryItem, testName} from '../../testing/generate-test-data';
import {getAssociatedPeople} from './get-associated-people';
import {updateAssociatedPeople} from './update-associated-people';
import {fetchItemAssociatedPeople} from '../people/fetch-item-associated-people';
import {updateSummaryItem} from './update-summary-item';

test('updateAssociatedPeople - 1 person', async () => {
  const itemText = 'test@test.miter.co';
  const meeting = await insertTestMeeting(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText);
  if (!summaryItem.noteId) throw `Here for TS reasons`;

  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText}));

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
  expect(itemAssociatedPeople).toHaveLength(1);
});

test('updateAssociatedPeople - 1 person 2x', async () => {
  const itemText = 'test@test.miter.co';
  const meeting = await insertTestMeeting(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText);
  if (!summaryItem.noteId) throw `Here for TS reasons`;

  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText}));
  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText}));

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
  expect(itemAssociatedPeople).toHaveLength(1);
});

test('updateAssociatedPeople - 2 people 1x', async () => {
  const itemText = 'test@test.miter.co sampleemailw@test.miter.co';
  const meeting = await insertTestMeeting(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText);
  if (!summaryItem.noteId) throw `Here for TS reasons`;

  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText}));

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
  expect(itemAssociatedPeople).toHaveLength(2);
});

test('updateAssociatedPeople - 1 person then 2 people', async () => {
  const itemText1 = 'test@test.miter.co';
  const itemText2 = 'test@test.miter.co sampleemailw@test.miter.co';
  const meeting = await insertTestMeeting(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText1);
  if (!summaryItem.noteId) throw `Here for TS reasons`;

  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText: itemText1}));
  await updateSummaryItem({id: summaryItem.id, itemText: itemText2});
  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText: itemText2}));

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
  expect(itemAssociatedPeople).toHaveLength(2);
});

test('updateAssociatedPeople - 2 people then 1 person', async () => {
  const itemText1 = 'test@test.miter.co sampleemailw@test.miter.co';
  const itemText2 = 'test@test.miter.co';
  const meeting = await insertTestMeeting(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText1);
  if (!summaryItem.noteId) throw `Here for TS reasons`;

  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText: itemText1}));
  await updateSummaryItem({id: summaryItem.id, itemText: itemText2});
  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText: itemText2}));

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
  expect(itemAssociatedPeople).toHaveLength(1);
});

test('updateAssociatedPeople - duplicates', async () => {
  const itemText = 'test@test.miter.co test@test.miter.co test@test.miter.co';
  const meeting = await insertTestMeeting(testName());
  const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, itemText);
  if (!summaryItem.noteId) throw `Here for TS reasons`;

  await updateAssociatedPeople(summaryItem?.noteId, summaryItem.id, await getAssociatedPeople({itemText}));

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
  expect(itemAssociatedPeople).toHaveLength(1);
});
