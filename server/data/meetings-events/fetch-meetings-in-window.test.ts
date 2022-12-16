import { fetchMeetingsInWindow } from "./fetch-meetings-in-window";


test('fetchMeetingsFromWindow -> 2 In Window', async () => {

  const startDatetime = new Date('2020-08-18');
  const endDateTime = new Date('2020-08-20');
  const personId = '9dea0517-3ef1-45ff-9cfa-cef1eb59504e';

  const meetingResult = await fetchMeetingsInWindow(personId, startDatetime, endDateTime, true, true, true);

  expect(meetingResult).toHaveLength(2);
  expect(meetingResult[0].meeting.title).toBe('Miter Test - 1st Meeting');

});

test('fetchMeetingsFromWindow -> 0 In Window', async () => {

  const startDatetime = new Date('2020-08-16');
  const endDateTime = new Date('2020-08-17');
  const personId = '9dea0517-3ef1-45ff-9cfa-cef1eb59504e';

  const meetingResult = await fetchMeetingsInWindow(personId, startDatetime, endDateTime, true, true, true);

  expect(meetingResult).toHaveLength(0);

});