/* TODO:
 *
 * [] Figure out where these should live.
 * [] Update and improve validation to be consistent with what we're doing on the Express side.
 * [] Create and integrate interfaces for each type of request as appropriate.
 * [] Move from Redis to Postgres.
 */

import {Endpoint} from '../../server-core/socket-server';
import {
  SocketRequestBody,
  MeetingTokenResponseBody,
  JoinMeetingRequest,
  PeopleResponse,
  MeetingResponse,
  Meeting,
} from 'miter-common/SharedTypes';
import {ValidationError} from 'miter-common/SharedTypes';
import {getMeetingForExternalIdentifier} from './endpoint-meeting-logic';
import {fetchMeetingContent} from '../../data/meetings-events/fetch-meeting';
import {fetchFirstMeetingFromMeetingSeries} from '../../data/meetings-events/fetch-meetings-from-meeting-series';
import {addMeetingAttendee} from '../../data/people/add-meeting-attendee';
import {fetchAttendees} from '../../data/people/fetch-attendees';
import {validateSocketRequestBody} from '../endpoint-utils';
import {createToken} from '../../data/create-token';
import {convertUserRecordToPerson} from '../../server-core/server-util';
import {MeetingWithToken, UserRecord} from '../../server-core/server-types';
import {fetchUserByMiterId} from '../../data/people/fetch-user';
import {BlockingOrganizationId, fetchLockingOrganizationId} from '../../data/people/fetch-organization';

const validateAndParseJoinMeetingRequest = (body: SocketRequestBody): JoinMeetingRequest => {
  const existsBody = validateSocketRequestBody(body);
  const identifier = existsBody.meetingExternalIdentifier;
  if (typeof identifier !== 'string') {
    throw new ValidationError(`Join requests expect a string identifier; got ${typeof identifier}.`);
  }
  return existsBody;
};

const verifyAuthorization = (lockingOrgId: string | null, meeting: Meeting): boolean => {
  if (meeting.organizationId === BlockingOrganizationId) {
    throw new Error('Meeting Blocked due to conflicting organizations');
  }
  if (!lockingOrgId && meeting.organizationId) throw new Error('Meeting is owned by another organization');
  if (lockingOrgId !== meeting.organizationId) {
    throw new Error('Meeting is not owned by your organization');
  }
  return true;
};

const getAttendeesAsUsersResponse = async (meetingId: string): Promise<PeopleResponse> => {
  const attendees = await fetchAttendees(meetingId);
  return {people: attendees.map(att => convertUserRecordToPerson(att))};
};

const potentiallyRerouteToFirstInstance = async (
  potentialFirstMeeting: MeetingWithToken
): Promise<MeetingWithToken> => {
  // NOTE: If a Single instance calendar event is converted into a Recurring Meeting Series (via edit in Gcal), a new instance is created at the exact same time but with a recurring-style service id
  // This would cause an existing meeting run in Miter to become inaccessible on via GCal / make it look like we've lost the data.
  // This is v1 of a fix which reroutes the join meeting endpoint to the proper instance (we will also need to make sure we filter properly in lists of meetings, etc)

  if (!potentialFirstMeeting.meeting.meetingSeriesId) return potentialFirstMeeting;

  // TODO: Add Content Flags into MeetingWithToken so we don't have to fetch the same meeting twice if we get to this phase
  const initialMeetingWithContent = await fetchMeetingContent(potentialFirstMeeting.meeting.id);
  if (
    initialMeetingWithContent.hasNotes ||
    initialMeetingWithContent.hasSummaryItems ||
    initialMeetingWithContent.hasTopics
  ) {
    return potentialFirstMeeting;
  }

  const firstMeetingInSeries = await fetchFirstMeetingFromMeetingSeries(
    potentialFirstMeeting.meeting.meetingSeriesId,
    true,
    true,
    true
  );
  if (
    firstMeetingInSeries.meeting.startDatetime?.getTime() !== potentialFirstMeeting.meeting.startDatetime?.getTime() ||
    (!firstMeetingInSeries.hasNotes && !firstMeetingInSeries.hasSummaryItems && !firstMeetingInSeries.hasTopics)
  ) {
    return potentialFirstMeeting;
  } else {
    const {meeting} = firstMeetingInSeries;
    const token = (await createToken({meetingId: meeting.id})).value;
    return {meeting, token};
  }
};

export const joinMeetingEndpoint: Endpoint = async (server, client, body) => {
  try {
    const validatedRequest = validateAndParseJoinMeetingRequest(body);
    const {userId} = server.getUserForClient(client);
    const user = (userId && (await fetchUserByMiterId(userId))) || null;

    // This will throw if (a) we have a Google event ID and aren't authed, (b) we have a Google event ID and lack access
    // via the primary calendar, or (c) something goes wrong with, say, the request out to Google.
    const existingOrIngestedMeetingWithToken = await getMeetingForExternalIdentifier(
      user,
      validatedRequest.meetingExternalIdentifier
    );
    const {meeting, token: possibleExistingToken} = await potentiallyRerouteToFirstInstance(
      existingOrIngestedMeetingWithToken
    );

    const lockingOrgId = await fetchLockingOrganizationId(user?.organizationId);
    verifyAuthorization(lockingOrgId, meeting);
    const tokenValue = possibleExistingToken || (await createToken({meetingId: meeting.id}))?.value;

    // Associate calendarEvent ID with socket (and remove any prior associations)
    server.setClientChannel(client, meeting.id);
    const res: MeetingResponse = {meeting};
    server.send(client, 'Meeting', res);

    const tokenRes: MeetingTokenResponseBody = {tokenValue};
    server.send(client, 'MeetingToken', tokenRes);

    // Add an attendee if this is an actual user (TODO handle guests)
    if (userId) {
      // Change attendance and broadcast to everyone
      await addMeetingAttendee(meeting.id, userId);
      server.broadcast(meeting.id, 'AllAttendees', await getAttendeesAsUsersResponse(meeting.id));
    } else {
      // Just send attendance down to the originating channel
      server.send(client, 'AllAttendees', await getAttendeesAsUsersResponse(meeting.id));
    }
  } catch (err: any) {
    // Most errors here aren't "true" errors so we send them back without tripping SocketServer's built-in error-handling.
    const res: MeetingResponse = {
      meeting: null,
      error: `${err.message || err}`,
      errorCode: err.statusCode || undefined,
    };
    server.send(client, 'Meeting', res);
  }
};
