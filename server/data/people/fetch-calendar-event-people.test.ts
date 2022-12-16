import {fetchCalendarEventPeople} from './fetch-calendar-event-people';

const picture = 'https://lh3.googleusercontent.com/a-/12345';

test('fetchCalendarEventPeople', async () => {
  const fetchCalendarEventPeopleResponse = await fetchCalendarEventPeople('eaa0e3b3-ca77-457c-9fa5-55d36c11191f');
  if (!fetchCalendarEventPeopleResponse) throw 'Meeting People not found';
  expect(fetchCalendarEventPeopleResponse).toHaveLength(3);
  expect(fetchCalendarEventPeopleResponse[0].displayName).toBe('Winchester Pratt');
  expect(fetchCalendarEventPeopleResponse[0].picture).toBe(picture);
});
