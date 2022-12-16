import {uuid} from 'miter-common/CommonUtil';
import {ProtocolItem, ProtocolItemType} from 'miter-common/SharedTypes';
import {createProtocolItemAction} from '../../data/protocol/actions/create-protocol-item-action';
import {deleteProtocolItemActionById} from '../../data/protocol/actions/delete-protocol-item-action';
import {createProtocolItem} from '../../data/protocol/items/create-protocol-item';

import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';

import updateProtocolItemEndpoint from './update-protocol-item-endpoint';
import updateProtocolItemGroupEndpoint from './update-protocol-item-group-endpoint';

describe('updateProtocolItemGroup', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  let protocolInfo: any;

  beforeAll(async () => {
    protocolInfo = await insertTestProtocol('updateProtocolItemGroup', {
      items: ['Item Text'],
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

  it('should fail when the protocol item ID is not present in the payload', async () => {
    const payload = {parentId: uuid()};
    await expect(updateProtocolItemEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should fail when the protocol item ID is not valid', async () => {
    const payload = {parentId: uuid(), protocolItemId: uuid()};
    await expect(updateProtocolItemEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should update the given protocol item group', async () => {
    const {id: protocolItemId} = protocolInfo.protocolItems[0];

    const payload = {protocolItemId, parentId: protocolInfo.group.id};
    await updateProtocolItemGroupEndpoint(server, client, payload);

    const fetchedProtocolItem = await fetchProtocolItemById(protocolItemId);
    expect(fetchedProtocolItem?.parentId).toEqual(payload.parentId);
  });

  it('should ungroup protocol item', async () => {
    const {id: protocolItemId} = protocolInfo.protocolItems[0];
    const payload = {protocolItemId, parentId: null};
    await updateProtocolItemGroupEndpoint(server, client, payload);

    const fetchedProtocolItem = await fetchProtocolItemById(protocolItemId);
    expect(fetchedProtocolItem?.parentId).toEqual(payload.parentId);
  });

  it('should copy protocol item actions to the group', async () => {
    const {id: protocolItemId} = protocolInfo.protocolItems[0];

    const protocolItemAction = await createProtocolItemAction({
      protocolId: protocolInfo.protocol.id,
      protocolItemId,
      creatorId: protocolInfo.protocol.creatorId,
      type: 'Vote',
    });

    const payload = {protocolItemId, parentId: protocolInfo.group.id};
    await updateProtocolItemGroupEndpoint(server, client, payload);

    const fetchedProtocolItem = await fetchProtocolItemById(protocolItemId);
    const updatedProtocolItemGroup = await fetchProtocolItemById(payload.parentId);
    expect(fetchedProtocolItem?.parentId).toEqual(payload.parentId);
    expect(updatedProtocolItemGroup?.actions).toHaveLength(1);
    deleteProtocolItemActionById(protocolItemAction.id);
  });
});
