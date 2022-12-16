import { Endpoint } from "../../server-core/socket-server";
import { TopicsResponse } from "miter-common/SharedTypes";
import { fetchAllTopicsForMeeting } from "../../data/topics/fetch-all-topics";
import { fetchTopicsFromPriorMeeting } from "../../data/meetings-events/fetch-topics-from-prior-meeting";
import { fetchMeeting } from "../../data/meetings-events/fetch-meeting";

export const fetchAllTopicsEndpoint: Endpoint = async (server, client, body) => {
  body = null; // We're not gonna use this, so don't bother validating but we'll null it out just to be safe.
  const meetingId = server.getExistingChannel(client);

  const topics = await fetchAllTopicsForMeeting(meetingId);

  // This is in response to an explicit fetch so we send rather than broadcast
  const res: TopicsResponse = { topics };
  server.send(client, 'AllTopics', res);
};

export const fetchPriorTopicsEndpoint: Endpoint = async (server, client, _body, requestId: string | undefined) => {
  const {userId} = server.getUserForClient(client);
  if (!userId) throw new Error('You must be signed in to fetch prior topics for a meeting.');

  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);

  const topics = await fetchTopicsFromPriorMeeting(meeting);

  const res: TopicsResponse = { topics };
  server.send(client, 'DirectResponse', res, requestId);

};

