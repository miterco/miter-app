import {insertTestMeetingAndCalendarEvent, insertTestNote, insertTestProtocol} from '../../testing/generate-test-data';
import {fetchNoteByProtocolId} from './fetch-note-by-protocol-id';

test('fetchNoteByProtocolId', async () => {
  const testName = 'fetchNoteByProtocolId';
  const meeting = await insertTestMeetingAndCalendarEvent(testName);
  const {protocol, deleteTestProtocol} = await insertTestProtocol(testName, {
    phases: ['Phase 1'],
    items: ['Item 1'],
  });
  const protocolId = protocol!.id;
  const note = await insertTestNote(meeting.meeting.id, testName, {protocolId});
  const fetchNoteResponse = await fetchNoteByProtocolId(protocolId);
  expect(fetchNoteResponse.protocolId).toBe(protocolId);
  expect(fetchNoteResponse.id).toBe(note.id);
  deleteTestProtocol();
});
