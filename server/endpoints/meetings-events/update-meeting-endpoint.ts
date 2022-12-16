import {UpdateMeetingRequest, MeetingResponse, ValidationError} from 'miter-common/SharedTypes';
import {validateSocketRequestBody} from '../endpoint-utils';
import {Endpoint} from '../../server-core/socket-server';
import {updateMeeting} from '../../data/meetings-events/update-meeting';

const validateUpdateMeetingRequest = (body: any): UpdateMeetingRequest => {
  const validBody = validateSocketRequestBody(body);

  if (validBody.title && typeof validBody.title !== 'string') {
    throw new ValidationError(`Update-meeting request expected title to be string, got ${validBody.title}`);
  }
  if (validBody.goal && typeof validBody.goal !== 'string') {
    throw new ValidationError(`Update-meeting request expected goal to be string, got ${validBody.goal}`);
  }
  if (!validBody.title && !validBody.goal) throw new ValidationError(`Received an empty update-meeting request.`);

  return {title: validBody.title, goal: validBody.goal};
};

export const updateMeetingEndpoint: Endpoint = async (server, client, body) => {
  const validReq = validateUpdateMeetingRequest(body);
  const meetingId = server.getExistingChannel(client);

  const updated = await updateMeeting({id: meetingId, ...validReq});

  const res: MeetingResponse = {meeting: updated};
  server.broadcast(meetingId, 'Meeting', res);
};
