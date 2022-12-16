import { insertTestMeeting, insertTestUser, testName } from '../../testing/generate-test-data';
import { addMeetingAttendee } from './add-meeting-attendee';
import { fetchAttendees } from './fetch-attendees';

let meetingId: string;

beforeEach(async () => {
  const meeting = await insertTestMeeting(testName());
  meetingId = meeting.id;
});

test('fetchAttendees - nobody there', async () => {
  const people = await fetchAttendees(meetingId);
  expect(people).toEqual([]);
});

test('fetchAttendees - one person', async () => {
  const user = await insertTestUser(testName());
  await addMeetingAttendee(meetingId, user.id);
  const people = await fetchAttendees(meetingId);
  expect(people).toHaveLength(1);

  const person = people[0];
  expect(person.displayName).toEqual(user.displayName);
  expect(person.picture).toEqual(user.picture);
});

test('fetchAttendees - two people', async () => {
  const user1 = await insertTestUser(testName());
  await addMeetingAttendee(meetingId, user1.id);
  const user2 = await insertTestUser(testName());
  await addMeetingAttendee(meetingId, user2.id);
  const people = await fetchAttendees(meetingId);
  expect(people).toHaveLength(2);
});
