import Joi from 'joi';
import {CreateProtocolItemActionRequest} from '../../../common/SharedTypes';
import {createProtocolItemAction} from '../../data/protocol/actions/create-protocol-item-action';
import {fetchProtocolById} from '../../data/protocol/fetch-protocol';
import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {updateProtocolById} from '../../data/protocol/update-protocol';
import {isCurrentPhaseCompleted} from '../../logic/protocols/next-phase';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

// ---------------------------------------------------------------------------------------------------------------------
//                               CREATE PROTOCOL ITEM ACTION - WEB SOCKET ENDPOINT
// ---------------------------------------------------------------------------------------------------------------------
export default socketEndpoint(
  // Message body validation.
  messageBodySchema({
    protocolItemId: Joi.string().guid().required(),
    actionType: Joi.string().required(),
  }),

  // Request handler.
  async (request, response) => {
    if (!request.userId) throw new Error('Only authenticated users can perform actions on protocol items');

    const {protocolItemId, actionType} = request.body as CreateProtocolItemActionRequest;
    const item = await fetchProtocolItemById(protocolItemId);

    if (!item?.id) throw new Error('Protocol item not found');

    await createProtocolItemAction({
      protocolId: item.protocolId,
      protocolItemId: item.id,
      creatorId: request.userId,
      type: actionType,
    });

    const protocol = await fetchProtocolById(item.protocolId);
    if (!protocol) throw new Error("Couldn't find the protocol associated with this protocol item");

    const readyForNextPhase = await isCurrentPhaseCompleted(protocol, request.meetingId, request.server);
    const updatedProtocol = await updateProtocolById(protocol.id, {readyForNextPhase});

    response.broadcast('Protocol', {updated: [updatedProtocol]}, {includeRequestId: true});
  }
);
