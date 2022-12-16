import Joi from 'joi';
import {CreateProtocolItemRequest, ProtocolItemType} from '../../../common/SharedTypes';
import {fetchProtocolById} from '../../data/protocol/fetch-protocol';
import {createProtocolItem} from '../../data/protocol/items/create-protocol-item';
import {updateProtocolById} from '../../data/protocol/update-protocol';
import {isCurrentPhaseCompleted} from '../../logic/protocols/next-phase';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

export default socketEndpoint(
  messageBodySchema({
    protocolId: Joi.string().guid().required(),
    text: Joi.string().required(),
    parentId: Joi.string().optional(),
  }),
  async (request, response) => {
    const {protocolId, text, parentId} = request.body as CreateProtocolItemRequest;
    const protocol = await fetchProtocolById(protocolId);

    if (!protocol?.id) throw new Error('Protocol not found');
    if (!protocol.currentPhase?.id) throw new Error('Protocol has no current phase');
    if (!request.userId) throw new Error('Only authenticated users can create new protocol items');

    const protocolItem = await createProtocolItem({
      text,
      protocolId,
      protocolPhaseId: protocol.currentPhase.id,
      creatorId: request.userId,
      type: ProtocolItemType.Item,
      parentId: parentId ?? null,
    });

    if (!protocolItem) throw new Error('Failed to create the protocol item');

    // Check if the protocol is ready to move to the next phase.
    const protocolReadyForNextPhase = await isCurrentPhaseCompleted(protocol, request.meetingId, request.server);
    const updatedProtocol = await updateProtocolById(protocol.id, {readyForNextPhase: protocolReadyForNextPhase});

    response.broadcast('Protocol', {updated: [updatedProtocol]});
  }
);
