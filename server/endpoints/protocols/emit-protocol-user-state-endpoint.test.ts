import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {UserRecord} from '../../server-core/server-types';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import emitProtocolUserStateEndpoint from './emit-protocol-user-state-endpoint';

describe('emitProtocolUserStateEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;
  let userId: string;

  beforeAll(async () => {
    jest.clearAllMocks();
    userId = (await insertTestUser(testName())).id;
  });

  it('should broadcast a ProtocolUserState response', async () => {
    const payload = {isDone: true};

    (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId});
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    await emitProtocolUserStateEndpoint(server, client, payload);

    const [_channelId, messageType, body] = broadcast.mock.calls[0];
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(messageType).toBe('ProtocolUserState');
    expect(body.userId).toEqual(userId);
    expect(body.isDone).toEqual(payload.isDone);
  });

  it('should throw an error when called with invalid data', async () => {
    const payloadMissingOrInvalidUserId = {isDone: true};
    const payloadWithAdditionalData = {isDone: true, additionalData: true};

    await expect(emitProtocolUserStateEndpoint(server, client, payloadMissingOrInvalidUserId)).rejects.toThrow();

    (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId: uuid()});
    await expect(emitProtocolUserStateEndpoint(server, client, payloadMissingOrInvalidUserId)).rejects.toThrow();

    (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId});
    await expect(emitProtocolUserStateEndpoint(server, client, payloadWithAdditionalData)).rejects.toThrow();
  });
});
