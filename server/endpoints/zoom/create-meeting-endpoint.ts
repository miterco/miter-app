import httpEndpoint from '../../server-core/http/http-endpoint';
import HttpError from '../../errors/HttpError';
import {createMeeting} from '../../data/meetings-events/create-meeting';
import {createToken} from '../../data/create-token';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';
import {fetchLockingOrganizationId} from '../../data/people/fetch-organization';

/**
 * Creates a new Miter meeting with the Zoom meeting identifiers (UID and NID) set.
 */
export const createMeetingWithZoomIdentifiersEndpoint = httpEndpoint(withHttpUser, async (request, response) => {
  const zoomMeetingUID = request.cookies.ZoomMeetingUID as string;
  const {zoomMeetingNID} = request.body;
  if (!zoomMeetingUID) throw new HttpError(400, 'Invalid request. Missing Zoom meeting UUID');

  const lockingOrganizationId = await fetchLockingOrganizationId(request.user?.organizationId);

  const meeting = await createMeeting({
    title: '',
    goal: null,
    startDatetime: new Date(),
    endDatetime: new Date(),
    allDay: false,
    phase: 'NotStarted',
    zoomMeetingId: zoomMeetingUID,
    zoomNumericMeetingId: zoomMeetingNID || undefined,
    organizationId: lockingOrganizationId,
  });
  if (!meeting) throw new HttpError(500, 'Failed to create a Miter meeting');

  const meetingToken = await createToken({meetingId: meeting.id});
  if (!meetingToken) throw new HttpError(500, 'Failed to create a token for the meeting');

  return {meetingToken: meetingToken.value};
});
