import { Endpoint } from "../../server-core/socket-server";
import { MeetingResponse, TopicsResponse } from "miter-common/SharedTypes";
import { fetchMeeting } from "../../data/meetings-events/fetch-meeting";
import { fetchAllTopicsForMeeting } from "../../data/topics/fetch-all-topics";
import { fetchTopicsFromPriorMeeting } from "../../data/meetings-events/fetch-topics-from-prior-meeting";
import { createBulkTopics } from "../../data/topics/create-bulk-topics";
import { setCurrentTopicForMeeting } from "../../data/topics/set-current-topic-for-meeting";


export const copyPriorTopicsEndpoint: Endpoint = async (server, client, body) => {
  const {userId} = server.getUserForClient(client);
  if (!userId) throw new Error(`User not logged in.`);

  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);

  const topics = await fetchTopicsFromPriorMeeting(meeting);
  if (topics) await createBulkTopics(meetingId, topics);

  const newTopics = await fetchAllTopicsForMeeting(meetingId);
  if (!newTopics) throw new Error(`This should never happen but createTopicEndpoint failed to retrieve All Topics for meeting ${meetingId}`);

  const res: TopicsResponse = { topics: newTopics };
  server.broadcast(meetingId, 'AllTopics', res);

  // If there's no current topic AND calendar event is in progress, make the new topic the current one.
  if (!meeting.currentTopicId && meeting.phase === 'InProgress') {
    const updatedMeeting = await setCurrentTopicForMeeting(meeting, newTopics[0].id);
    const res: MeetingResponse = { meeting: updatedMeeting };
    server.broadcast(meetingId, 'Meeting', res);
  }

};

