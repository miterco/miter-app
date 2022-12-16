// Batch-add attendees

import { fetchAttendees } from "../data/people/fetch-attendees";
import { insertTestUser, testName, insertTestMeeting } from "../testing/generate-test-data";
import { addMultipleSocketUsersAsAttendees } from "./endpoint-utils";
import {v4 as uuid} from 'uuid';

test('Add multiple attendees at once, all succeed', async () => {
  const user1 = await insertTestUser(`User 1 - ${testName}`);
  const user2 = await insertTestUser(`User 2 - ${testName}`);
  const socketUser1 = { userId: user1.id };
  const socketUser2 = { userId: user2.id };
  const meeting = await insertTestMeeting(testName());

  const addResult = await addMultipleSocketUsersAsAttendees(meeting.id, [socketUser1, socketUser2]);
  expect(addResult).toBe(true);

  const attendees = await fetchAttendees(meeting.id);
  expect(attendees).toHaveLength(2);

  const attendeeIds = attendees.map(attendee => attendee.id);
  expect(attendeeIds).toEqual(expect.arrayContaining([socketUser1.userId, socketUser2.userId]));
});

test('Add multiple attendees at once, some fail', async () => {
  const user1 = await insertTestUser(`User 1 - ${testName}`);
  const userId2 = uuid();
  const socketUser1 = { userId: user1.id };
  const socketUser2 = { userId: userId2 };
  const socketUser3 = { userId: '' };
  const meeting = await insertTestMeeting(testName());

  const socketPromise = addMultipleSocketUsersAsAttendees(meeting.id, [socketUser2, socketUser1, socketUser3]);
  await expect(socketPromise).rejects.toBe(`Could not locate user or person for User ID: ${userId2}.`);

  // We're not blocking on errors, so we should still have an attendee.
  const attendees = await fetchAttendees(meeting.id);
  expect(attendees).toHaveLength(1);

  const attendeeIds = attendees.map(attendee => attendee.id);
  expect(attendeeIds).toEqual(expect.arrayContaining([socketUser1.userId]));
});
