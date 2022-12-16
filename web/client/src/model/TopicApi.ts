import {
  CreateTopicRequest,
  DeleteTopicRequest,
  UpdateTopicRequest,
  SetCurrentTopicForMeetingRequest,
  Topic,
} from 'miter-common/SharedTypes';
import conn from '../SocketConnection';
import {validateTopicsResponse} from './Validators';

export const requestTopics = () => {
  conn.request('FetchAllTopics');
};

export const createTopic = (text: string) => {
  const req: CreateTopicRequest = {text};
  conn.request('CreateTopic', req);
};

export const editTopic = (topic: UpdateTopicRequest) => {
  // TODO revisit fallback once Topic interface is finalized.
  const req: UpdateTopicRequest = {id: topic.id, text: topic.text || undefined, order: topic.order};
  conn.request('UpdateTopic', req);
};

export const deleteTopic = (topic: Topic) => {
  const req: DeleteTopicRequest = {id: topic.id};
  conn.request('DeleteTopic', req);
};

export const setCurrentTopic = (topic: Topic) => {
  const req: SetCurrentTopicForMeetingRequest = {topicId: topic.id};
  conn.request('SetCurrentTopic', req);
};

export const fetchHasPriorTopics = async () => {
  try {
    const rawResponse = await conn.requestResponse('FetchPriorTopics');
    const priorTopicsResponse = validateTopicsResponse(rawResponse);
    return Boolean(priorTopicsResponse.topics.length);
  } catch (err) {
    return false;
  }
};

export const copyPriorTopics = () => conn.request('CopyPriorTopics');
