import {uuid} from 'miter-common/CommonUtil';
import {createProtocolItemAction} from '../../data/protocol/actions/create-protocol-item-action';
import {fetchAllProtocolItemActionsByProtocolId} from '../../data/protocol/actions/fetch-all-protocol-item-actions';
import {fetchProtocolItemsByPhaseId} from '../../data/protocol/items/fetch-all-protocol-items';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {
  insertTestMeetingAndCalendarEvent,
  insertTestNoteAndSummaryItem,
  insertTestProtocol,
} from '../../testing/generate-test-data';
import deleteProtocolEndpoint from './delete-protocol-endpoint';

describe('deleteProtocolEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;
  let testData: any;
  let hasDeleteProtocolEndpointFailed = false;

  beforeAll(async () => {
    testData = await insertTestProtocol('deleteProtocol', {
      phases: ['Phase 1'],
      items: ['Item 1'],
    });
    await createProtocolItemAction({
      protocolId: testData.protocol.id,
      protocolItemId: testData.protocolItems[0].id,
      type: 'Vote',
      creatorId: testData.protocol.creatorId,
    });

    const {meeting} = await insertTestMeetingAndCalendarEvent('deleteProtocolEndpoint');

    await insertTestNoteAndSummaryItem(meeting.id, 'deleteProtocolEndpoint note', {
      protocolId: testData.protocol.id,
    });

    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.creator.id});
    (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
    const payload = {protocolId: testData.protocol.id};
    try {
      await deleteProtocolEndpoint(server, client, payload);
    } catch (error) {
      hasDeleteProtocolEndpointFailed = true;
    }
  });

  afterAll(() => {
    testData.deleteTestProtocol({excludeItems: true, excludeProtocol: true});
  });

  it('should call the endpoint successfully', () => {
    expect(hasDeleteProtocolEndpointFailed).toBe(false);
  });

  it('should also delete all protocol item actions', async () => {
    const protocolItemActions = await fetchAllProtocolItemActionsByProtocolId(testData.protocol.id);

    expect(protocolItemActions).toHaveLength(0);
  });

  it('should also delete all protocol items', async () => {
    const protocolItems = await fetchProtocolItemsByPhaseId(testData.protocol.id, testData.protocol.type.phases[0].id);

    expect(protocolItems).toHaveLength(0);
  });

  it('should send a Protocol response', async () => {
    const [_channelId, responseType] = broadcast.mock.calls[0];
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(responseType).toBe('Protocol');
  });

  it('should include the deleted protocol in the response', async () => {
    const [_channelId, _responseType, body] = broadcast.mock.calls[0];
    const deletedProtocol = body.deleted[0];
    expect(deletedProtocol.id).toBe(testData.protocol.id);
  });
});
