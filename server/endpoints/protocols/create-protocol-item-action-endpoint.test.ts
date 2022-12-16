import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';
import createProtocolItemActionEndpoint from './create-protocol-item-action-endpoint';

describe('createProtocolItemActionEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;

  beforeAll(async () => {
    jest.resetAllMocks();
  });

  it('should send a Protocol response', async () => {
    const testData = await insertTestProtocol('createProtocolItemActionEndpoint', {
      phases: ['Phase 1'],
      items: ['Item 1'],
    });

    const payload = {protocolItemId: testData.protocolItems[0].id, actionType: 'Vote'};
    (server.getMembersForChannel as jest.Mock).mockReturnValue([]);
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.creator.id});
    await createProtocolItemActionEndpoint(server, client, payload);

    const [_channelId, responseType, body] = broadcast.mock.calls[0];
    const updatedProtocol = body.updated[0];

    // It should broadcast the protocol change.
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(responseType).toBe('Protocol');

    // It should contain the created action.
    expect(updatedProtocol.items[0]?.actions[0].type).toBe('Vote');
    expect(updatedProtocol.items[0]?.actions[0].creatorId).toBe(testData.creator.id);
  });
});
