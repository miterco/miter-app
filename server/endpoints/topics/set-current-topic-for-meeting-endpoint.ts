import { validateSocketRequestBody } from '../endpoint-utils';
import { Endpoint } from '../../server-core/socket-server';
import { SetCurrentTopicForMeetingRequest, MeetingResponse, SystemMessageType, UpdatedNotesResponse, ValidationError } from 'miter-common/SharedTypes';
import { validate } from 'uuid';
import { fetchMeeting } from '../../data/meetings-events/fetch-meeting';
import { createSystemMessage } from '../../data/notes-items/create-note';
import { setCurrentTopicForMeeting } from '../../data/topics/set-current-topic-for-meeting';
import { removeCurrentTopicFromMeeting } from '../../data/topics/remove-current-topic-from-meeting';

const validateSetCurrentTopicForMeetingRequest = (body: any): SetCurrentTopicForMeetingRequest => {
  const validBody = validateSocketRequestBody(body);

  if (validBody.topicId && (typeof validBody.topicId !== 'string' || !validate(validBody.topicId))) throw new ValidationError(`Set-topic-for-meeting-item request expected text to be id, got ${validBody.text}`);

  return { topicId: validBody.topicId };
};

export const setCurrentTopicForMeetingEndpoint: Endpoint = async (server, client, body) => {

  const systemMessageType: SystemMessageType = 'CurrentTopicSet';
  const createdBy = server.getUserForClient(client).userId;
  const validReq = validateSetCurrentTopicForMeetingRequest(body);
  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);

  const {topicId} = validReq;
  const currentTopicId = meeting.currentTopicId || null;
  if (topicId !== currentTopicId) {
    const updatedMeeting = topicId ? await setCurrentTopicForMeeting(meeting, topicId) : await removeCurrentTopicFromMeeting(meeting);
    const res: MeetingResponse = { meeting: updatedMeeting };
    server.broadcast(meetingId, 'Meeting', res);

    const newNote = await createSystemMessage({
      meetingId: meeting.id,
      topicId,
      systemMessageType,
      createdBy,
    });

    const resNotes: UpdatedNotesResponse = { created: [newNote] };
    server.broadcast(meetingId, 'UpdatedNotes', resNotes);
  }
};