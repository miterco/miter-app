import { fetchMeetingSeries } from "./fetch-meeting-series";

test('FetchMeetingSeries', async () => {

  const meetingSeriesId = '35c297c5-bacf-4e11-bfcc-89ead277b775';
  const meetingSeries = await fetchMeetingSeries(meetingSeriesId);
  expect(meetingSeries.title).toBe('Recurring Meeting Series');
});