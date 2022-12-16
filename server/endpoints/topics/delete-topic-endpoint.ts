import { validateSocketRequestBody } from "../endpoint-utils";
import { Endpoint } from "../../server-core/socket-server";
import { TopicsResponse, DeleteTopicRequest, ValidationError } from "miter-common/SharedTypes";
import { fetchMeeting } from "../../data/meetings-events/fetch-meeting";
import { validate } from "uuid";
import { deleteTopic } from "../../data/topics/delete-topic";
import { fetchAllTopicsForMeeting } from "../../data/topics/fetch-all-topics";
import { fetchTopic } from "../../data/topics/fetch-topic";



const validateDeleteTopicRequest = (body: any): DeleteTopicRequest => {
  const validBody = validateSocketRequestBody(body);
  if (typeof validBody.id !== 'string' || !validate(validBody.id)) throw new ValidationError(`Delete-topic request expected text to be id, got ${validBody.text}`);
  return { id: validBody.id };
};

export const deleteTopicEndpoint: Endpoint = async (server, client, body) => {
  const validReq = validateDeleteTopicRequest(body);
  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);

  const topic = await fetchTopic(validReq.id);
  if (!topic) throw `deleteTopicEndpoint failed to find topic: ${validReq.id}`;
  if (meeting.id !== topic.meetingId) throw `deleteTopicEndpoint, meeting ID: ${meeting.id} did not match Topic: ${topic.id}`;

  const result = await deleteTopic(topic.id);
  const newTopics = await fetchAllTopicsForMeeting(meeting.id);

  const res: TopicsResponse = { topics: newTopics || [] };
  server.broadcast(meetingId, 'AllTopics', res);
};
