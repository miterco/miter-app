import {insertTestMeetingAndCalendarEvent, insertTestNote, insertTestProtocol} from '../../testing/generate-test-data';
import {deleteNoteByProtocolId} from './delete-note-by-protocol-id';
import {fetchNoteByProtocolId} from './fetch-note-by-protocol-id';

test('deleteNoteByProtocolId', async () => {
  const testName = 'deleteNoteByProtocolId';
  const meeting = await insertTestMeetingAndCalendarEvent(testName);
  const {protocol, deleteTestProtocol} = await insertTestProtocol(testName, {
    phases: ['Phase 1'],
    items: ['Item 1'],
  });
  const protocolId = protocol!.id;
  const note = await insertTestNote(meeting.meeting.id, testName, {protocolId});
  const deletedNote = await deleteNoteByProtocolId(protocolId);
  expect(deletedNote.protocolId).toBe(protocolId);
  expect(deletedNote.id).toBe(note.id);
  deleteTestProtocol();
});
