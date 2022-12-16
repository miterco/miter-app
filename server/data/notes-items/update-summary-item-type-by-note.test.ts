import {uuid} from 'miter-common/CommonUtil';
import {insertTestMeeting, insertTestNoteAndSummaryItem, testName} from '../../testing/generate-test-data';
import {updateSummaryItemTypeByNote} from './update-summary-item-type-by-note';

describe('updateSummaryItemByNote', () => {
  it('should return null if provided with an ID that does not exist in the db', async () => {
    const noteId = uuid();

    const updatedSummaryItem = await updateSummaryItemTypeByNote(noteId, 'Pin');
    expect(updatedSummaryItem).toBeFalsy();
  });

  it('should return an updated Summary Item when provided with an ID that exists in the db', async () => {
    const meeting = await insertTestMeeting(testName());
    const {note} = await insertTestNoteAndSummaryItem(meeting.id, testName(), {itemType: 'Decision'});
    const updatedSummaryItem = await updateSummaryItemTypeByNote(note.id, 'Task');
    expect(updatedSummaryItem?.itemType).toBe('Task');
  });
});
