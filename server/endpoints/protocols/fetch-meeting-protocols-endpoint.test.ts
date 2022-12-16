import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import fetchMeetingProtocols from './fetch-meeting-protocols-endpoint';

describe('fetchMeetingProtocols', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const meetingId = uuid();
  server.getExistingChannel = jest.fn(() => meetingId);

  beforeAll(async () => {
    const payload = {};
    await fetchMeetingProtocols(server, client, payload);
  });

  it('should send an AllMeetingProtocols response with all the protocols for the meeting', async () => {
    const send = server.send as any;
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(client, 'AllMeetingProtocols', {protocols: []}, undefined);
  });
});
