import {uuid} from 'miter-common/CommonUtil';
import {Protocol} from 'miter-common/SharedTypes';
import {createProtocolItemAction} from '../../data/protocol/actions/create-protocol-item-action';
import {fetchAllProtocolItemActionsByProtocolId} from '../../data/protocol/actions/fetch-all-protocol-item-actions';
import {fetchProtocolById} from '../../data/protocol/fetch-protocol';
import {fetchProtocolItemsByPhaseId} from '../../data/protocol/items/fetch-all-protocol-items';
import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {
  insertTestMeetingAndCalendarEvent,
  insertTestNoteAndSummaryItem,
  insertTestProtocol,
} from '../../testing/generate-test-data';
import deleteProtocolEndpoint from './delete-protocol-endpoint';
import deleteProtocolItemEndpoint from './delete-protocol-item-endpoint';

describe('deleteProtocolItemEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;
  let testData: any;
  let hasDeleteProtocolItemEndpointFailed = false;

  beforeAll(async () => {
    testData = await insertTestProtocol('deleteProtocolItem', {
      phases: ['Phase 1'],
      items: ['Item 1', 'Item 2'],
    });

    testData.protocolItemId = testData.protocolItems?.[0].id;

    await createProtocolItemAction({
      protocolId: testData.protocol.id,
      protocolItemId: testData.protocolItemId,
      type: 'Vote',
      creatorId: testData.protocol.creatorId,
    });

    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.creator.id});
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    const payload = {protocolItemId: testData.protocolItemId};
    try {
      await deleteProtocolItemEndpoint(server, client, payload);
      testData.protocol = await fetchProtocolById(testData.protocol.id);
    } catch (error) {
      hasDeleteProtocolItemEndpointFailed = true;
    }
  });

  afterAll(() => {
    testData.deleteTestProtocol({excludeItems: !hasDeleteProtocolItemEndpointFailed});
  });

  it('should call the endpoint successfully', () => {
    expect(hasDeleteProtocolItemEndpointFailed).toBe(false);
  });

  it('should also delete the protocol item action associated to the protocol item', async () => {
    const protocolItemActions = await fetchAllProtocolItemActionsByProtocolId(testData.protocol.id);

    expect(protocolItemActions).toHaveLength(0);
  });

  it('should delete protocol item', async () => {
    const fetchedProtocolItem = await fetchProtocolItemById(testData.protocolItemId);
    expect(fetchedProtocolItem).toBeFalsy();
  });

  it('should send a ProtocolItem response', async () => {
    const [_channelId, responseType] = broadcast.mock.calls[0];
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(responseType).toBe('ProtocolItem');
  });

  it('should include the deleted protocol item id and the protocol id in the response', async () => {
    const [_channelId, _responseType, body] = broadcast.mock.calls[0];
    const deletedProtocolItem = body.deleted[0];

    expect(deletedProtocolItem.id).toBe(testData.protocolItemId);
    expect(deletedProtocolItem.protocolId).toBe(testData.protocol.id);
  });
});
