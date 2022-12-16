import { validateSocketRequestBody } from "../endpoint-utils";
import { Endpoint } from "../../server-core/socket-server";
import { TopicsResponse, CreateTopicRequest, MeetingResponse, ValidationError } from "miter-common/SharedTypes";
import { fetchMeeting } from "../../data/meetings-events/fetch-meeting";
import { createTopic } from "../../data/topics/create-topic";
import { fetchAllTopicsForMeeting } from "../../data/topics/fetch-all-topics";
import { setCurrentTopicForMeeting } from "../../data/topics/set-current-topic-for-meeting";

const validateCreateTopicRequest = (body: any): CreateTopicRequest => {
  const validBody = validateSocketRequestBody(body);

  if (typeof validBody.text !== 'string') throw new ValidationError(`Create-topic request expected text to be string, got ${validBody.text}`);
  if (validBody.order && typeof validBody.order !== 'number') throw new ValidationError(`Create-topic request expected goal to be string, got ${validBody.goal}`);

  return { text: validBody.text, order: validBody.order };
};

export const createTopicEndpoint: Endpoint = async (server, client, body) => {
  const validReq = validateCreateTopicRequest(body);
  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);

  const newTopic = await createTopic({ meetingId, ...validReq, createdBy: server.getUserForClient(client).userId });
  if (!newTopic) throw new Error(`createTopicEndpoint failed to create a topic for meeting ${meetingId}`);

  const newTopics = await fetchAllTopicsForMeeting(meetingId);
  if (!newTopics) throw new Error(`This should never happen but createTopicEndpoint failed to retrieve All Topics for meeting ${meetingId}`);

  const res: TopicsResponse = { topics: newTopics };
  server.broadcast(meetingId, 'AllTopics', res);

  // If there's no current topic AND calendar event is in progress, make the new topic the current one.
  if (!meeting.currentTopicId && meeting.phase === 'InProgress') {
    const updatedMeeting = await setCurrentTopicForMeeting(meeting, newTopic.id);
    const res: MeetingResponse = { meeting: updatedMeeting };
    server.broadcast(meetingId, 'Meeting', res);
  }

};


