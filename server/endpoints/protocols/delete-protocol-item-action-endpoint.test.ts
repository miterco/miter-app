import {uuid} from 'miter-common/CommonUtil';
import {ProtocolItemAction} from 'miter-common/SharedTypes';
import {createProtocolItemAction} from '../../data/protocol/actions/create-protocol-item-action';
import {fetchAllProtocolItemActionsByProtocolId} from '../../data/protocol/actions/fetch-all-protocol-item-actions';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';
import deleteProtocolItemActionEndpoint from './delete-protocol-item-action-endpoint';

describe('deleteProtocolItemActionEndpoint', () => {
  const server = mockSocketServer() as any;
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;
  let testData: any;
  let action: ProtocolItemAction;

  beforeAll(async () => {
    testData = await insertTestProtocol('deleteProtocolItemActionEndpoint', {
      phases: ['Phase 1'],
      items: ['Item 1'],
    });
    action = await createProtocolItemAction({
      protocolId: testData.protocol.id,
      protocolItemId: testData.protocolItems[0].id,
      type: 'Vote',
      creatorId: testData.protocol.creatorId,
    });

    const payload = {protocolItemActionId: action.id};
    (server.getMembersForChannel as jest.Mock).mockReturnValue([]);
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.creator.id});
    await deleteProtocolItemActionEndpoint(server, client, payload);
  });

  afterAll(() => {
    testData.deleteTestProtocol();
  });

  it('should send a Protocol response', async () => {
    const [_channelId, responseType, {updated}] = broadcast.mock.calls[0];
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(responseType).toBe('Protocol');
    expect(updated[0].readyForNextPhase).toBe(true);
  });

  it('should not include the deleted action in the response', async () => {
    const [_channelId, _responseType, body] = broadcast.mock.calls[0];
    const updatedProtocol = body.updated[0];
    expect(updatedProtocol.items[0].actions).toHaveLength(0);
  });

  it('should delete the action from the database', async () => {
    const protocolActions = await fetchAllProtocolItemActionsByProtocolId(testData.protocol.id);
    expect(protocolActions).toHaveLength(0);
  });
});
