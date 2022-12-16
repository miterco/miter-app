import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import requestProtocolUserStateEndpoint from './request-protocol-user-state-endpoint';

describe('requestProtocolUserStateEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;

  beforeAll(() => {
    jest.clearAllMocks();
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
  });

  it('should broadcast a ProtocolUserStateRequest message', async () => {
    const payload = {sessionId: uuid(), protocolId: uuid()};
    await requestProtocolUserStateEndpoint(server, client, payload);

    const [_channelId, messageType] = broadcast.mock.calls[0];

    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(messageType).toBe('ProtocolUserStateRequest');
  });

  it('should throw when not provided a session id', async () => {
    const payload = {protocolId: uuid()};
    await expect(requestProtocolUserStateEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should throw when not provided a protocol id', async () => {
    const payload = {sessionId: uuid()};
    await expect(requestProtocolUserStateEndpoint(server, client, payload)).rejects.toThrow();
  });
});
