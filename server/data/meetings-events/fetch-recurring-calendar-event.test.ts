import {fetchRecurringCalendarEventByGoogleId} from './fetch-recurring-calendar-event';

const serviceId = 'fake98wa7498w7hc987w48c8a7h498wahc984e94wa9h8749a49c84h978h49';
const startString = 'Monday, Aug 17, 2020, 5:00:00 PM';
const endString = 'Monday, Aug 17, 2020, 5:00:00 PM';

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Los_Angeles',
};

test('fetchRecurringCalendarEventByGoogleId', async () => {
  const fetchRecurringCalendarEventResponse = await fetchRecurringCalendarEventByGoogleId(serviceId);
  expect(fetchRecurringCalendarEventResponse?.startDate?.toLocaleTimeString('en-US', options)).toBe(startString);
  expect(fetchRecurringCalendarEventResponse?.endDate?.toLocaleTimeString('en-US', options)).toBe(endString);
});
