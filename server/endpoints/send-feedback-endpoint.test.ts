import {TestUserId} from '../testing/generate-test-data';
import {v4 as uuid} from 'uuid';
import {SendFeedbackRequest} from 'miter-common/SharedTypes';
import {sendFeedbackEndpoint} from './send-feedback-endpoint';
import {mockSocketServer, mockWebSocket} from '../data/test-util';

test('send feedback endpoint - base case', async () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getUserForClient as jest.Mock).mockReturnValueOnce({TestUserId});

  const reqId = uuid();
  const req: SendFeedbackRequest = {email: 'schvenk@gmail.com', feedback: 'AUTOMATED_FEEDBACK_ENDPOINT_TEST'};
  await sendFeedbackEndpoint(server, client, req, reqId);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'DirectResponse', {}, reqId);
});

test('send feedback endpoint - GSuite address', async () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getUserForClient as jest.Mock).mockReturnValueOnce({TestUserId});

  const reqId = uuid();
  const req: SendFeedbackRequest = {email: 'darwin@test.miter.co', feedback: 'AUTOMATED_FEEDBACK_ENDPOINT_TEST'};
  await sendFeedbackEndpoint(server, client, req, reqId);

  expect(server.send).toHaveBeenCalledTimes(1);
  expect(server.send).toHaveBeenCalledWith(client, 'DirectResponse', {}, reqId);
});

test('send feedback endpoint - missing content', async () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getUserForClient as jest.Mock).mockReturnValueOnce({TestUserId});

  const reqId = uuid();
  const req: SendFeedbackRequest = {email: 'test.fake@test.miter.co', feedback: ' '};
  await expect(sendFeedbackEndpoint(server, client, req, reqId)).rejects.toThrow();
});

test('send feedback endpoint - malformed email', async () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getUserForClient as jest.Mock).mockReturnValueOnce({TestUserId});

  const reqId = uuid();
  const req: SendFeedbackRequest = {email: 'test.fake_miter.co', feedback: 'Some feedback'};
  await expect(sendFeedbackEndpoint(server, client, req, reqId)).rejects.toThrow();
});
