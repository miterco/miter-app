import Joi from 'joi';
import {PrioritizeProtocolItemRequest} from 'miter-common/SharedTypes';
import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {prioritizeProtocolItemById} from '../../data/protocol/items/prioritize-protocol-item';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

export default socketEndpoint(
  messageBodySchema({
    protocolItemId: Joi.string().guid().required(),
    shouldPrioritize: Joi.boolean().required(),
  }),
  async (request, response) => {
    const {protocolItemId, shouldPrioritize} = request.body as PrioritizeProtocolItemRequest;
    const protocolItem = await fetchProtocolItemById(protocolItemId);

    if (!protocolItem?.id) throw new Error('Protocol item not found');

    const updatedProtocolItem = await prioritizeProtocolItemById(protocolItemId, {
      isForcefullyPrioritized: shouldPrioritize,
      isForcefullyDeprioritized: !shouldPrioritize,
    });

    response.broadcast('ProtocolItem', {updated: [updatedProtocolItem]});
  }
);
