import {uuid} from 'miter-common/CommonUtil';
import {ProtocolItemType} from 'miter-common/SharedTypes';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';
import createProtocolItemGroupEndpoint from './create-protocol-item-group-endpoint';

describe('createProtocolItemGroupEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;

  beforeAll(async () => {
    jest.resetAllMocks();
  });

  it('should send a Protocol response', async () => {
    const testData = await insertTestProtocol('createProtocolItemGroupEndpoint', {phases: ['Phase 1']});

    const payload = {protocolId: testData.protocol?.id, text: 'Protocol item group name'};
    (server.getMembersForChannel as jest.Mock).mockReturnValue([]);
    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.creator.id});
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    await createProtocolItemGroupEndpoint(server, client, payload);

    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][1]).toBe('Protocol');
    const updatedProtocol = broadcast.mock.calls[0][2].updated[0];
    const updatedProtocolItem = updatedProtocol.items[0];
    expect(updatedProtocolItem.type).toBe(ProtocolItemType.Group);
  });
});
