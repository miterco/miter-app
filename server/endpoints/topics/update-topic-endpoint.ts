import {validateSocketRequestBody} from '../endpoint-utils';
import {Endpoint} from '../../server-core/socket-server';
import {TopicsResponse, UpdateTopicRequest, ValidationError} from 'miter-common/SharedTypes';
import {validate} from 'uuid';
import {updateTopic} from '../../data/topics/update-topic';
import {fetchAllTopicsForMeeting} from '../../data/topics/fetch-all-topics';
import {fetchTopic} from '../../data/topics/fetch-topic';

const validateUpdateTopicRequest = (body: any): UpdateTopicRequest => {
  const validBody = validateSocketRequestBody(body);

  if (typeof validBody.id !== 'string' || !validate(validBody.id)) {
    throw new ValidationError(`Edit-topic request expected text to be id, got ${validBody.text}`);
  }
  if (validBody.text !== undefined && typeof validBody.text !== 'string') {
    throw new ValidationError(`Edit-topic request expected text to be string, got ${validBody.text}`);
  }
  if (validBody.order !== undefined && typeof validBody.order !== 'number') {
    throw new ValidationError(`Edit-topic request expected order to be number, got ${validBody.goal}`);
  }
  if (!(validBody.text || validBody.order)) {
    throw new ValidationError(`Received an edit-topic request that contained no changes.`);
  }

  return {id: validBody.id, text: validBody.text, order: validBody.order};
};

export const updateTopicEndpoint: Endpoint = async (server, client, body) => {
  const validReq = validateUpdateTopicRequest(body);
  const meetingId = server.getExistingChannel(client);
  const topic = await fetchTopic(validReq.id);

  if (meetingId !== topic?.meetingId) throw `Topic: ${topic?.id} does not match meeting: ${meetingId}`;

  await updateTopic({...validReq});

  const editedTopics = await fetchAllTopicsForMeeting(meetingId);
  const res: TopicsResponse = {topics: editedTopics};
  server.broadcast(meetingId, 'AllTopics', res);
};
