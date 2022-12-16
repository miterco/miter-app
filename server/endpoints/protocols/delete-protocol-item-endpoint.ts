import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {DeleteProtocolItemRequest} from 'miter-common/SharedTypes';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {deleteProtocolItemById} from '../../data/protocol/items/delete-protocol-item';
import {deleteProtocolItemActionsByProtocolItemId} from '../../data/protocol/actions/delete-protocol-item-action';

export default socketEndpoint(
  messageBodySchema({
    protocolItemId: Joi.string().guid().required(),
  }),
  async (request, response) => {
    const {protocolItemId} = request.body as DeleteProtocolItemRequest;

    if (!request.userId) throw new Error('Only authenticated users can delete protocols');

    const protocolItem = await fetchProtocolItemById(protocolItemId);

    if (request.userId !== protocolItem?.creatorId) {
      throw new Error('Only the user who created the protocol item can delete it');
    }

    await deleteProtocolItemActionsByProtocolItemId(protocolItemId);
    await deleteProtocolItemById(protocolItemId);

    response.broadcast('ProtocolItem', {deleted: [{id: protocolItemId, protocolId: protocolItem?.protocolId}]});
  }
);
