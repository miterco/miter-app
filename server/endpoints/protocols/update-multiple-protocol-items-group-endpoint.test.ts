import {uuid} from 'miter-common/CommonUtil';
import {ProtocolItemType} from 'miter-common/SharedTypes';
import {createProtocolItemAction} from '../../data/protocol/actions/create-protocol-item-action';
import {deleteProtocolItemActionById} from '../../data/protocol/actions/delete-protocol-item-action';
import {createProtocolItem} from '../../data/protocol/items/create-protocol-item';

import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';
import updateMultipleProtocolItemsGroupEndpoint from './update-multiple-protocol-items-group-endpoint';

describe('updateMultipleProtocolItemGroupEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  let protocolInfo: any;

  beforeAll(async () => {
    protocolInfo = await insertTestProtocol('updateMultipleProtocolItemGroupEndpoint', {
      items: ['First Item', 'Second Item'],
      phases: ['Phase 1'],
    });
    const {protocolPhases, protocol} = protocolInfo;
    const firstPhase = protocolPhases[0];
    const group = await createProtocolItem({
      protocolId: protocol!.id,
      text: 'Test Group',
      protocolPhaseId: firstPhase.id,
      type: ProtocolItemType.Group,
      creatorId: protocol!.creatorId as string,
    });
    protocolInfo.group = group;
  });

  afterAll(() => {
    protocolInfo.deleteTestProtocol();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
  });

  it('should fail when the protocol items ID are not present in the payload', async () => {
    const payload = {parentId: uuid()};
    await expect(updateMultipleProtocolItemsGroupEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should update the given protocol item group', async () => {
    const {id: firstProtocolItemId} = protocolInfo.protocolItems[0];
    const {id: secondProtocolItemId} = protocolInfo.protocolItems[1];

    const payload = {protocolItemIds: [firstProtocolItemId, secondProtocolItemId], parentId: protocolInfo.group.id};
    await updateMultipleProtocolItemsGroupEndpoint(server, client, payload);

    const updatedFirstProtocolItem = await fetchProtocolItemById(firstProtocolItemId);
    const updatedSecondProtocolItem = await fetchProtocolItemById(secondProtocolItemId);
    expect(updatedFirstProtocolItem?.parentId).toEqual(payload.parentId);
    expect(updatedSecondProtocolItem?.parentId).toEqual(payload.parentId);
  });

  it('should copy protocol item actions to the group', async () => {
    const {id: firstProtocolItemId} = protocolInfo.protocolItems[0];
    const {id: secondProtocolItemId} = protocolInfo.protocolItems[1];

    const protocolItemAction = await createProtocolItemAction({
      protocolId: protocolInfo.protocol.id,
      protocolItemId: firstProtocolItemId,
      creatorId: protocolInfo.protocol.creatorId,
      type: 'Vote',
    });

    const payload = {protocolItemIds: [firstProtocolItemId, secondProtocolItemId], parentId: protocolInfo.group.id};
    await updateMultipleProtocolItemsGroupEndpoint(server, client, payload);

    const updatedProtocolItemGroup = await fetchProtocolItemById(payload.parentId);
    expect(updatedProtocolItemGroup?.actions).toHaveLength(1);
    deleteProtocolItemActionById(protocolItemAction.id);
  });
});
