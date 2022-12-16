import { fetchMeeting, fetchMeetingByCalendarEvent, fetchMeetingContent, fetchMeetingByZoomMeetingId } from './fetch-meeting';

const miterIdForZoomMeeting = 'b98fb173-3214-4915-a357-ed091a257046';
const zoomMeetingId = 'cac994dd-98e3-4931-b48f-cbd9b76bf9ef';
const calendarEventId = 'eaa0e3b3-ca77-457c-9fa5-55d36c11191f';
const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1580';
const title = "Miter Test - 1st Meeting";
const goal = "Test Miter";

const startString = "Tuesday, Aug 18, 2020, 2:00:00 PM";
const endString = "Tuesday, Aug 18, 2020, 3:00:00 PM";

const options: Intl.DateTimeFormatOptions = {
  year: "numeric",
  weekday: "long",
  month: 'short',
  day: 'numeric',
};


test('fetchMeetingByCalendarEvent', async () => {
    const fetchMeetingResponse = await fetchMeetingByCalendarEvent(calendarEventId);
    expect(fetchMeetingResponse?.title).toBe(title);
    expect(fetchMeetingResponse?.goal).toBe(goal);
    expect(fetchMeetingResponse?.startDatetime?.toLocaleTimeString('en-US', options)).toBe(startString);
    expect(fetchMeetingResponse?.endDatetime?.toLocaleTimeString('en-US', options)).toBe(endString);
});


test('fetchMeetingByZoomMeetingId', async () => {
    const meeting = await fetchMeetingByZoomMeetingId(zoomMeetingId);
    expect(meeting?.id).toBe(miterIdForZoomMeeting);
});

test('fetchMeetingByZoomMeetingId - no meeting available', async () => {
    const meeting = await fetchMeetingByZoomMeetingId('123457890');
    expect(meeting).toBeNull();
});


test('fetchMeeting', async () => {
    const fetchMeetingResponse = await fetchMeeting(meetingId);
    expect(fetchMeetingResponse?.title).toBe(title);
    expect(fetchMeetingResponse?.goal).toBe(goal);
    expect(fetchMeetingResponse?.startDatetime?.toLocaleTimeString('en-US', options)).toBe(startString);
    expect(fetchMeetingResponse?.endDatetime?.toLocaleTimeString('en-US', options)).toBe(endString);
});


test('fetchMeetingContent', async () => {
    const meetingContent = await fetchMeetingContent(meetingId);

    expect(meetingContent.hasNotes).toBeTruthy();
    expect(meetingContent.hasSummaryItems).toBeTruthy();
    expect(meetingContent.hasTopics).toBeTruthy();
});
