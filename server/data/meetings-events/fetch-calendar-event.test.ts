import {
  fetchCalendarEventByMiterId,
  fetchCalendarEventByGoogleId,
  fetchCalendarEventByMeetingId,
} from './fetch-calendar-event';

jest.mock('../../google-apis/google-calendar');

const serviceId = '98ef77e9g5e95978esr5789esr987s9r785798rs5978r57e59sr78h5ve7rs8';
const miterId = 'eaa0e3b3-ca77-457c-9fa5-55d36c11191f';
const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1580';
const title = 'Miter Test';
const goal = 'Test Miter';
const startString = 'Monday, Aug 17, 2020, 5:00:00 PM';
const endString = 'Monday, Aug 17, 2020, 5:00:00 PM';

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Los_Angeles',
};

test('fetchCalendarEventByGoogleId', async () => {
  const fetchCalendarEventResponse = await fetchCalendarEventByGoogleId(serviceId);
  expect(fetchCalendarEventResponse?.title).toBe(title);
  expect(fetchCalendarEventResponse?.startDate?.toLocaleTimeString('en-US', options)).toBe(startString);
  expect(fetchCalendarEventResponse?.endDate?.toLocaleTimeString('en-US', options)).toBe(endString);
});

test('fetchCalendarEventByMiterId', async () => {
  const fetchCalendarEventResponse = await fetchCalendarEventByMiterId(miterId);
  expect(fetchCalendarEventResponse?.title).toBe(title);
  expect(fetchCalendarEventResponse?.startDate?.toLocaleTimeString('en-US', options)).toBe(startString);
  expect(fetchCalendarEventResponse?.endDate?.toLocaleTimeString('en-US', options)).toBe(endString);
});

test('fetchCalendarEventByMeetingId', async () => {
  const fetchCalendarEventResponse = await fetchCalendarEventByMeetingId(meetingId);
  expect(fetchCalendarEventResponse?.title).toBe(title);
  expect(fetchCalendarEventResponse?.startDate?.toLocaleTimeString('en-US', options)).toBe(startString);
  expect(fetchCalendarEventResponse?.endDate?.toLocaleTimeString('en-US', options)).toBe(endString);
});
