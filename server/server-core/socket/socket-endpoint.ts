import {ResponseBody, SocketRequestBody, SocketResponseType} from 'miter-common/SharedTypes';
import {UserRecord} from '../server-types';
import {Client, Endpoint, SocketServer} from '../socket-server';

export interface SocketRequest {
  server: SocketServer;
  client: Client;
  body: SocketRequestBody;
  meetingId: string;
  meetingIdOrNull: string | null;
  userId: string | null;
  user?: UserRecord;
  id?: string;
}

export interface SocketResponse {
  send: SendResponseFunction;
  broadcast: BroadcastFunction;
}

// Socket endpoint arguments.
type SendResponseFunction = <T = ResponseBody>(
  messageType: SocketResponseType,
  data: T,
  options?: SocketMessageOptions
) => void;
type BroadcastFunction = <T = ResponseBody>(
  messageType: SocketResponseType,
  data: T,
  options?: SocketMessageOptions
) => void;
interface SocketMessageOptions {
  includeRequestId: boolean;
}

export type SocketEndpoint = (request: SocketRequest, response: SocketResponse) => Promise<ResponseBody | void>;

const DefaultSocketMessageOptions: SocketMessageOptions = {
  includeRequestId: false,
};

const socketEndpoint = (...handlers: SocketEndpoint[]): Endpoint => {
  return async (server, client, body, requestId) => {
    const request: SocketRequest = {
      server,
      client,
      body,
      userId: server.getUserForClient(client)?.userId,
      id: requestId,
      get meetingId() {
        return server.getExistingChannel(client);
      },
      get meetingIdOrNull() {
        try {
          return server.getExistingChannel(client);
        } catch (_err) {
          return null;
        }
      },
    };

    /**
     * Gets the requestId only if it hasn't been sent in a previous response, otherwise it returns undefined.
     *
     * The reason this is not allowed is because when a response with a requestId is sent, the client will attempt to
     * find the resolvers for that requestId. The first response containing the requestId will succeed and the resolvers
     * will be executed and deleted afterwards. The second response will attempt to do the same, however, it will fail
     * to find any resolvers for that requestId since they were deleted after the client handled the first response.
     *
     * @param askedToSendRequestId - whether or not the endpoint means to include the requestId in the next response.
     * @returns the requestId if it hasn't been used yet.
     */
    let alreadyUsedRequestId = false;
    const getRequestId = (askedToSendRequestId: boolean) => {
      if (!askedToSendRequestId) return undefined;
      if (alreadyUsedRequestId) {
        console.error('A socket endpoint tried sending the same requestId in two responses');
        return undefined;
      }

      alreadyUsedRequestId = true;
      return requestId;
    };

    const response: SocketResponse = {
      /**
       * Sends a DirectResponse to the user who originally sent the socket message.
       *
       * @param data - the payload for the resposne.
       * @param options.includeRequestId - allows awaiting for the response when set to true.
       */
      send: (messageType, data, options: SocketMessageOptions = DefaultSocketMessageOptions) => {
        server.send(client, messageType, data, getRequestId(options.includeRequestId));
      },

      /**
       * Broadcasts a message to everyone in the meeting.
       *
       * @param messageType - the broadcasted message type.
       * @param data - the payload for the message.
       */
      broadcast: (messageType, data, options: SocketMessageOptions = DefaultSocketMessageOptions) => {
        // Although this is a broadcasted message, the `requestId` is required to be able to await for the response
        // using `SocketConnection` in the client.
        if (request.meetingId) {
          server.broadcast(request.meetingId, messageType, data, getRequestId(options.includeRequestId));
        }
      },
    };

    for (const handler of handlers) {
      const responseBody: ResponseBody | void = await handler(request, response); // eslint-disable-line no-await-in-loop

      if (responseBody) {
        response.send('DirectResponse', responseBody, {includeRequestId: true});
      }
    }
  };
};

export default socketEndpoint;
