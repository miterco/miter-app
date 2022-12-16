import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../../data/test-util';
import fetchProtocolTypesEndpoint from './fetch-protocol-types-endpoint';

describe('fetchProtocolTypesEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  beforeAll(async () => {
    const requestId = uuid();
    const payload = {};
    await fetchProtocolTypesEndpoint(server, client, payload, requestId);
  });

  it('should send an AllProtocolTypes response with all the protocol types', async () => {
    const send = server.send as any;
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][1]).toBe('AllProtocolTypes');
  });
});
