import { BulkMeetingResponse, MeetingWithTokenValue } from "miter-common/SharedTypes";
import { createOrFetchBulkTokensForMeetingIds } from "../../data/create-bulk-tokens";
import { fetchMeeting } from "../../data/meetings-events/fetch-meeting";
import { fetchPastMeetingsFromMeetingSeries } from "../../data/meetings-events/fetch-meetings-from-meeting-series";
import { Endpoint } from "../../server-core/socket-server";


export const fetchPriorMeetingsEndpoint: Endpoint = async (server, client, _body, requestId) => {
  const {userId} = server.getUserForClient(client);
  let meetingList: MeetingWithTokenValue[] = [];

  // If we don't have a user ID (user not signed in), we send back an empty array.
  // TODO long-term: More nuanced access control
  // TODO maybe: Some indication to the client that the lack of data is based on lack of sign-in

  if (userId) {
    const meetingId = server.getExistingChannel(client);
    const meeting = await fetchMeeting(meetingId);
    const cutoff = meeting.startDatetime;

    const {meetingSeriesId} = meeting;

    if (meetingSeriesId && cutoff) {
      const pastMeetingList = await fetchPastMeetingsFromMeetingSeries(meetingSeriesId, cutoff);
      meetingList = await createOrFetchBulkTokensForMeetingIds(pastMeetingList.map(meetingRow => meetingRow.meeting.id));
    }


    meetingList.sort((a: MeetingWithTokenValue, b: MeetingWithTokenValue) => {
      const startA = a.startDatetime?.getTime() || 0; // TS munging - null or undefined date should not be returned by Prisma
      const startB = b.startDatetime?.getTime() || 0;

      if (startA === startB) return 0;
      if (startA < startB) return 1;
      return -1;
    });
  }

  const res: BulkMeetingResponse = { meetings: meetingList };
  server.send(client, 'DirectResponse', res, requestId);
};
