import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '{% relativeDataDir %}/test-util';
import {% fnName %} from './{% fileName %}';

describe('{% fnName %}', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  beforeAll(async () => {
    const requestId = uuid();
    const payload = {};
    await {% fnName %}(server, client, payload, requestId);
  });

  it('should send an {% responseType %} response with all the protocol types', async () => {
    const send = server.send as any;
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][1]).toBe('{% responseType %}');
  });
});
