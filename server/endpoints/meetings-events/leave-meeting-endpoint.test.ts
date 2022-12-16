import {leaveMeetingEndpoint} from './leave-meeting-endpoint';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

/*
 * TODO This is a pretty lame test for a very simple endpoint. A more robust test would require a
 * working socket server (rather than a mock). Honestly, some tests for socket server would be useful
 * anyway, but given the simplicity of this endpoint, I'm not prioritizing that investment right now.
 * It's probably worth looking into relatively soon, given we're still finding bugs in socket server.
 * Added to infra backlog for now. (Jan 13, 2022)
 */
test('Leave-meeting endpoint', async () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  await leaveMeetingEndpoint(server, client, null);
  expect(server.setClientChannel).toBeCalledWith(client, null);
  expect(server.send).toBeCalledWith(client, 'LeftMeeting', {});
});