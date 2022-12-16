import {deleteNote} from './delete-note';
import {createNote} from './create-note';
import {fetchNote} from './fetch-note';
import {insertTestMeetingAndCalendarEvent, testName} from '../../testing/generate-test-data';

test('deleteNote', async () => {
  const itemText = 'newNote';

  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());

  const {note: newNote} = await createNote({
    meetingId: meeting.id,
    itemText,
    createdBy: null,
    targetDate: null,
    itemType: 'None',
  });

  const newNoteId = newNote.id;
  expect(newNote.itemText).toBe(itemText);

  await deleteNote(newNoteId);

  await expect(fetchNote(newNoteId)).rejects.toThrow();
});
