import {protocolItem} from '@prisma/client';
import Joi from 'joi';
import {ProtocolItem, UpdateMultipleProtocolItemsGroupRequest} from 'miter-common/SharedTypes';
import {updateMultipleProtocolItemsById} from '../../data/protocol/items/update-protocol-item';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {copyItemActionsToGroup} from './update-protocol-item-group-endpoint';

export default socketEndpoint(
  messageBodySchema({
    protocolItemIds: Joi.array().items(Joi.string().guid()).required(),
    parentId: Joi.string().guid().allow(null),
  }),
  async (request, response) => {
    const {protocolItemIds, parentId} = request.body as UpdateMultipleProtocolItemsGroupRequest;
    let updated: ProtocolItem[] = [];
    if (parentId) {
      const updatedGroup = await copyItemActionsToGroup(parentId, protocolItemIds);
      if (updatedGroup) updated.push(updatedGroup);
    }

    const newGroupItems = await updateMultipleProtocolItemsById(protocolItemIds, {parentId});
    if (newGroupItems) {
      updated = updated.concat(newGroupItems);
    }
    response.broadcast('ProtocolItem', {updated});
    return updated;
  }
);
