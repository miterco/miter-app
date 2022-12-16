import {protocolItemAction} from '@prisma/client';
import Joi from 'joi';
import {ProtocolItem, ProtocolItemAction, UpdateProtocolItemGroupRequest} from 'miter-common/SharedTypes';
import {createMultipleProtocolItemActions} from '../../data/protocol/actions/create-protocol-item-action';
import {fetchAllProtocolItemActionsByProtocolItemIds} from '../../data/protocol/actions/fetch-all-protocol-item-actions';
import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {updateProtocolItemById} from '../../data/protocol/items/update-protocol-item';
import {UnsavedProtocolItemAction} from '../../server-core/server-types';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

export const copyItemActionsToGroup = async (groupId: string, protocolItemIds: string[]) => {
  const actions: ProtocolItemAction[] = await fetchAllProtocolItemActionsByProtocolItemIds(protocolItemIds);
  const newActions: UnsavedProtocolItemAction[] = actions.map(({creatorId, protocolId, type}) => ({
    protocolItemId: groupId,
    creatorId,
    protocolId,
    type,
  }));

  await createMultipleProtocolItemActions(newActions);
  return await fetchProtocolItemById(groupId);
};

export default socketEndpoint(
  messageBodySchema({
    protocolItemId: Joi.string().guid().required(),
    parentId: Joi.string().guid().allow(null),
  }),
  async (request, response) => {
    const updatedProtocolItems: ProtocolItem[] = [];
    const {protocolItemId, parentId} = request.body as UpdateProtocolItemGroupRequest;
    const protocolItem = await fetchProtocolItemById(protocolItemId);

    if (!protocolItem) throw new Error(`Protocol item not found: ${protocolItemId}`);

    if (parentId) {
      const updatedParentProtocolItem = await copyItemActionsToGroup(parentId, [protocolItemId]);
      if (updatedParentProtocolItem) {
        updatedProtocolItems.push(updatedParentProtocolItem);
      }
    }
    const updatedProtocolItem = await updateProtocolItemById(protocolItemId, {parentId});
    updatedProtocolItems.push(updatedProtocolItem);

    // It is important to broadcast the update protocol, instead of simply using `.send()`, because this allows for
    // every open session (tab) to receive the updated protocol item and keep the user's solo-state in sync across
    // all sessions.
    response.broadcast('ProtocolItem', {updated: updatedProtocolItems});
    return updatedProtocolItems;
  }
);
