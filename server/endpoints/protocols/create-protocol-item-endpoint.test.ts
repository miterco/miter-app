import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';
import createProtocolItemEndpoint from './create-protocol-item-endpoint';
import {ProtocolItemType} from 'miter-common/SharedTypes';

describe('createProtocolItemEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;

  beforeAll(async () => {
    jest.resetAllMocks();
  });

  it('should send a Protocol response', async () => {
    const testData = await insertTestProtocol('createProtocolItemEndpoint', {phases: ['Phase 1']});

    const payload = {protocolId: testData.protocol?.id, text: 'Protocol item text'};
    (server.getMembersForChannel as jest.Mock).mockReturnValue([]);
    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.creator.id});
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    await createProtocolItemEndpoint(server, client, payload);

    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][1]).toBe('Protocol');
    const updatedProtocol = broadcast.mock.calls[0][2].updated[0];
    const updatedProtocolItem = updatedProtocol.items[0];
    expect(updatedProtocolItem.type).toBe(ProtocolItemType.Item);
  });
});
