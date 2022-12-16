import {createToken} from './create-token';
import {v4 as uuid} from 'uuid';
import {insertTestMeetingAndCalendarEvent, testName} from '../testing/generate-test-data';

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Los_Angeles',
};

test('createToken - meeting only', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const meetingId = meeting.id;
  const token = await createToken({meetingId});

  if (!token) throw 'Token not created - done as exception for Typescript reasons';
  expect(token.meetingId).toBe(meetingId);
  expect(token.expirationDate.toLocaleTimeString('en-US', options)).toBe('Sunday, Dec 31, 2299, 4:00:00 PM');
});

test('createToken - meeting, expiration date, value', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const meetingId = meeting.id;
  const value = uuid();
  const expirationDate = new Date();

  const token = await createToken({meetingId, value, expirationDate});

  expect(token.meetingId).toBe(meetingId);
  expect(token.expirationDate.toLocaleTimeString('en-US', options)).toEqual(
    expirationDate.toLocaleTimeString('en-US', options)
  );
  expect(token.value).toBe(value);
});
