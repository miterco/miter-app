
import { addMeetingAttendee } from "./add-meeting-attendee";
import { insertTestMeeting, testName } from "../../testing/generate-test-data";


test('Add User to Meeting', async () => {


  const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
  const personId = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';

  const newMeeting = await insertTestMeeting(testName());
  const newMeetingPerson = await addMeetingAttendee(newMeeting.id, userId);

  expect(newMeetingPerson?.meetingId).toBe(newMeeting.id);
  expect(newMeetingPerson?.personId).toBe(personId);

});