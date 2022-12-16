import Joi from 'joi';
import {UpdateProtocolItemRequest} from 'miter-common/SharedTypes';
import {updateProtocolItemById} from '../../data/protocol/items/update-protocol-item';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

export default socketEndpoint(
  messageBodySchema({
    protocolItemId: Joi.string().guid().required(),
    text: Joi.string().required(),
  }),
  async (request, response) => {
    const {protocolItemId, text} = request.body as UpdateProtocolItemRequest;
    const protocolItem = await updateProtocolItemById(protocolItemId, {text});

    // It is important to broadcast the update protocol, instead of simply using `.send()`, because this allows for
    // every open session (tab) to receive the updated protocol item and keep the user's solo-state in sync across
    // all sessions.
    response.broadcast('ProtocolItem', {updated: [protocolItem]});
    return protocolItem;
  }
);
