import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {DeleteProtocolItemActionRequest} from 'miter-common/SharedTypes';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import {deleteProtocolItemActionById} from '../../data/protocol/actions/delete-protocol-item-action';
import {fetchProtocolById} from '../../data/protocol/fetch-protocol';
import {isCurrentPhaseCompleted} from '../../logic/protocols/next-phase';
import {updateProtocolById} from '../../data/protocol/update-protocol';

// ---------------------------------------------------------------------------------------------------------------------
//                                DELETE PROTOCOL ITEM ACTION - WEB SOCKET ENDPOINT
// ---------------------------------------------------------------------------------------------------------------------
export default socketEndpoint(
  // Message body validation.
  messageBodySchema({
    protocolItemActionId: Joi.string().guid().required(),
  }),

  // Request handler.
  async (request, response) => {
    if (!request.userId) throw new Error('Only authenticated users can delete protocol item actions.');

    const {protocolItemActionId} = request.body as DeleteProtocolItemActionRequest;
    const action = await deleteProtocolItemActionById(protocolItemActionId);

    const protocol = await fetchProtocolById(action.protocolId);
    if (!protocol) throw new Error("Couldn't find the protocol associated with this protocol item");

    const readyForNextPhase = await isCurrentPhaseCompleted(protocol, request.meetingId, request.server);
    const updatedProtocol = await updateProtocolById(protocol.id, {readyForNextPhase});

    response.broadcast('Protocol', {updated: [updatedProtocol]}, {includeRequestId: true});
  }
);
