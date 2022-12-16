import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {MeetingResponse, ValidationError, DeleteProtocolRequest} from 'miter-common/SharedTypes';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import {updateMeeting} from '../../data/meetings-events/update-meeting';
import {deleteProtocolById} from '../../data/protocol/delete-protocol';

export default socketEndpoint(
  messageBodySchema({
    protocolId: Joi.string().guid().required(),
  }),
  async (request, response) => {
    const {protocolId} = request.body as DeleteProtocolRequest;
    const meeting = request.meetingId ? await fetchMeeting(request.meetingId) : null;

    if (!protocolId) throw new ValidationError('No protocol id provided');
    if (!request.userId) throw new Error('Only authenticated users can delete protocols');
    if (meeting?.currentProtocolId === protocolId) {
      const updatedMeeting = await updateMeeting({id: request.meetingId, currentProtocolId: null});
      response.broadcast<MeetingResponse>('Meeting', {meeting: updatedMeeting});
    }

    await deleteProtocolById(protocolId);

    response.broadcast('Protocol', {deleted: [{id: protocolId}]});
  }
);
