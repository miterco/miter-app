import {createSummaryItem} from './create-summary-item';
import {updateSummaryItem} from './update-summary-item';
import {
  insertTestNoteAndSummaryItem,
  insertTestMeeting,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {UpdateSummaryItemRequest} from 'miter-common/SharedTypes';
import {fetchNote} from './fetch-note';

describe('updateSummaryItem()', () => {
  it('Should correctly update text passed to it', async () => {
    const meeting = await insertTestMeeting(testName());
    const item = await createSummaryItem({
      meetingId: meeting.id,
      noteId: null,
      createdBy: null,
      itemText: testName(),
      itemType: 'Decision',
      targetDate: null,
    });

    const updatedText = `Updated - ${testName()}`;
    const req: UpdateSummaryItemRequest = {id: item.id, itemText: updatedText};
    const {summaryItem, note} = await updateSummaryItem(req);

    expect(summaryItem.itemText).toEqual(updatedText);
    expect(note).toBeNull();
  });

  it('Edit summary item - change topic & update note', async () => {
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

    const {summaryItem, note} = await insertTestNoteAndSummaryItem(meeting.id, testName());
    expect(summaryItem.topicId).toBeFalsy();

    const topic = await insertTestTopic(meeting.id, testName());

    const req: UpdateSummaryItemRequest = {id: summaryItem.id, topicId: topic.id};
    const {summaryItem: updatedSummaryItem, note: returnedNote} = await updateSummaryItem(req);

    // Do both returned objects reflect the change?
    expect(updatedSummaryItem?.topicId).toEqual(topic.id);
    expect(returnedNote?.topicId).toEqual(topic.id);

    // Do the returned objects match the originals?
    expect(returnedNote?.id).toEqual(note.id);
    expect(updatedSummaryItem?.id).toBe(summaryItem.id);
    expect(updatedSummaryItem.noteId).toBe(note.id);

    // If we fetch the note by summary ID, does it match the returned note?
    if (!updatedSummaryItem.noteId) throw new Error('Summary item is missing a note ID.');
    const fetchedNote = await fetchNote(updatedSummaryItem.noteId);
    expect(fetchedNote.id).toBe(note.id);
    expect(fetchedNote.topicId).toBe(topic.id);
  });
});
