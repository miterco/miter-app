import {fetchNonUsersFromMeeting} from '../../data/people/fetch-people';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

/**
 * Endpoint to fetch all the non-registered participants in the meeting.
 */
const fetchNonUsersFromInviteeListEndpoint = socketEndpoint(async ({userId, meetingIdOrNull}, response) => ({
  people: userId && meetingIdOrNull ? await fetchNonUsersFromMeeting(meetingIdOrNull) : [],
}));

export default fetchNonUsersFromInviteeListEndpoint;
