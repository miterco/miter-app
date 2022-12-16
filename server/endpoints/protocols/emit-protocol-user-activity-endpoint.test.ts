import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import emitProtocolUserActivity from './emit-protocol-user-activity-endpoint';
import {TestUserId} from '../../testing/generate-test-data';
import {uuid} from 'miter-common/CommonUtil';

describe('emitProtocolUserActivity', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  beforeAll(() => {
    jest.clearAllMocks();
  });

  it('should broadcast a ProtocolUserActivity response', async () => {
    const payload = {};
    (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId: TestUserId});
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
    await emitProtocolUserActivity(server, client, payload);

    const broadcast = server.broadcast as any;
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][1]).toBe('ProtocolUserActivity');
    expect(broadcast.mock.calls[0][2].userId).toBe(TestUserId);
  });
});
