import httpEndpoint from '../../server-core/http/http-endpoint';
import HttpError from '../../errors/HttpError';
import {fetchMeetingByToken} from '../../data/fetch-token';
import {setZoomMeetingIdentifiers} from '../../data/meetings-events/set-zoom-identifiers';

/**
 * Adds the Zoom meeting identifiers to the meeting corresponding to the provided meeting token.
 */
export const correlateMeetingsEndpoint = httpEndpoint(async (request, response) => {
  const zoomMeetingUID = request.cookies.ZoomMeetingUID as string;
  const zoomMeetingNID = (request.params.zoomMeetingNID as string) || undefined;
  const {meetingToken} = request.body;

  if (!meetingToken) throw new HttpError(400, 'Missing meeting token');
  if (!zoomMeetingUID) throw new HttpError(400, 'Missing Zoom meeting UID');

  const meeting = await fetchMeetingByToken(meetingToken);
  if (!meeting) throw new HttpError(404, 'Invalid meeting token');

  const updatedMeeting = await setZoomMeetingIdentifiers(meeting.id, zoomMeetingNID, zoomMeetingUID);
  if (!updatedMeeting) throw new HttpError(500, "Failed to correlate the Zoom meeting to Miter's");

  return {meetingToken};
});
