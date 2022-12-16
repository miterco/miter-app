import { fetchFirstMeetingFromMeetingSeries } from './fetch-meetings-from-meeting-series';

/* Commented out because we're not using the function it tests.
_test('fetchMeetingsFromRecurringCalendarEvent', async () => {

  const meetingSeriesId = '35c297c5-bacf-4e11-bfcc-89ead277b775';
  const meetingList = await fetchMeetingsFromMeetingSeries(meetingSeriesId);

  if (!meetingList || meetingList.length === 0) throw 'Meeting Series not found';

  expect(meetingList.length).toBe(2);
  expect(meetingList[1].title).toBe('2nd Recurring Foo');
  expect(meetingList[0].title).toBe('Initial Recurring Foo');

});
*/


test('fetchFirstMeetingFromMeetingSeries', async () => {

  const meetingSeriesId = '35c297c5-bacf-4e11-bfcc-89ead277b775';
  const firstMeeting = await fetchFirstMeetingFromMeetingSeries(meetingSeriesId);

  if (!firstMeeting) throw 'Meeting Series not found';

  expect(firstMeeting.meeting.title).toBe('Initial Recurring Foo');

});