import {
  fetchMeetingByZoomMeetingId,
  fetchMeetingByZoomNumericMeetingId,
} from '../../data/meetings-events/fetch-meeting';
import {updateMeetingZoomId} from '../../data/meetings-events/update-meeting-zoom-id';
import httpEndpoint from '../../server-core/http/http-endpoint';
import HttpError from '../../errors/HttpError';
import {fetchOrCreateMeetingTokenByMeetingId} from '../../data/fetch-token';

const RECYCLE_MEETING_INTERVAL = 10 * 60 * 1000; // Ten minutes.

const getTokenValueForZoomMeetingId = async (zoomMeetingUID: string, zoomMeetingNID: string | null) => {
  // Try to fetch the meeting by its UUID.
  let meeting = await fetchMeetingByZoomMeetingId(zoomMeetingUID);

  // Every time you click on a Zoom join link, if there's nobody in the room yet, it will create a new Zoom meeting
  // with a different UUID. This leads to Miter creating several meetings for the same Zoom meeting if you join the
  // meeting using the link several times (because it has a different UUID every time).
  //
  // To prevent this, we define a time interval to recycle meetings if they have the same numeric meeting ID and they
  // were created recently (the time interval is defined by the RECYCLE_MEETING_INTERVAL constant at the top of this
  // file).
  if (!meeting && zoomMeetingNID !== null) {
    // Try to find a meeting with the same numeric ID within the last 10 minutes.
    const lastMeeting = await fetchMeetingByZoomNumericMeetingId(zoomMeetingNID);
    const recycleMeetingTime = new Date(Date.now() - RECYCLE_MEETING_INTERVAL);

    // Check if there's an existing meeting with the same numeric ID within the recycling time.
    if (lastMeeting?.createdDate && lastMeeting.createdDate > recycleMeetingTime) {
      await updateMeetingZoomId(lastMeeting.id, zoomMeetingUID);
      meeting = lastMeeting;
    }
  }

  if (meeting) {
    const meetingToken = await fetchOrCreateMeetingTokenByMeetingId(meeting.id);
    return meetingToken?.value || null;
  }

  return null;
};

export const fetchMeetingTokenEndpoint = httpEndpoint(async (req, res) => {
  const zoomMeetingNID = (req.params.zoomMeetingNID as string) || null; // Numeric ID.
  const zoomMeetingUID = req.cookies.ZoomMeetingUID; // Alphanumeric ID.
  if (!zoomMeetingUID) throw new HttpError(400, 'Missing a Zoom meeting UID');

  return {
    meetingToken: await getTokenValueForZoomMeetingId(zoomMeetingUID, zoomMeetingNID),
  };
});
