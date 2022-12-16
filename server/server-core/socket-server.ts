/*
 * Socket server that handles real-time communciation with clients. Basic idea is this:
 * Client sends a message, one of several predetermined types defined in SocketEvent.
 * We take appropriate action here, and then broadcast the resulting changes to all
 * appropriate socket clients. The broadcast message will be of type SocketResponseType.
 *
 * Broadcast is a bit brute-force: we loop over all open socket connections and send to
 * any whose meeting ID matches the one we want.
 */

import * as Sentry from '@sentry/node';
import {Server} from 'http';
import ws from 'ws';
import {
  AuthRequest,
  ErrorResponse,
  SocketRequestBody,
  SocketRequestMessage,
  SocketRequestType,
  ResponseBody,
  SocketResponseMessage,
  SocketResponseType,
} from 'miter-common/SharedTypes'; // TODO is there a better place from which to share files between client and server?
import {UserRecord} from './server-types';
import {ValidationError} from 'miter-common/SharedTypes';
import {decryptZoomUserId, log, logPerf} from './server-util';
import {v4 as uuid} from 'uuid';
import {isValidUuid} from 'miter-common/CommonUtil';

// This no longer does anything at runtime but I'm leaving it in
// to retain encapsulation, avoid unnecessary API changes, and
// because it does no harm at runtime.
export interface Client extends ws {}

export type Endpoint = (
  server: SocketServer,
  client: Client,
  body: SocketRequestBody,
  requestId?: string,
  user?: UserRecord
) => Promise<ResponseBody | void>;
export type MemberChangeType = 'Increase' | 'Decrease';
export type ChannelMemberChangeHandler = (
  server: SocketServer,
  channelId: string,
  members: SocketUser[],
  changeType: MemberChangeType
) => void;
export type SocketUser = {userId: string | null; userInfo?: Record<string, any>};
export type AuthenticateUserCallback = (miterUserId: string | undefined) => Promise<SocketUser>;
export type UserDidFinishAuthenticatingCallback = (server: SocketServer, client: Client, user: SocketUser) => void;

export class SocketServer {
  private _channelMemberChangeHandlers: ChannelMemberChangeHandler[] = [];
  private _authenticateCallback: AuthenticateUserCallback | null = null;
  private _didFinishAuthCallback: UserDidFinishAuthenticatingCallback | null = null;

  // Socket Table: Encapsulating socket-indexing logic with a simple closure + hash table.
  private socketTable = (() => {
    interface ClientMeta {
      userId: string | null;
      channelId: string | null;
      isAuthenticating: boolean;
      requestQueue: SocketRequestMessage[];
      userInfo: Record<string, any>; // Allows users of socket server store/cache stuff
    }
    interface _ClientWithId extends Client {
      _miterClientId?: string;
    }

    const _socketIndex = {} as Record<string, ClientMeta>;
    const _channelIndex = {} as Record<string, {clients: Array<Client>; meta: Map<string, any>}>; // TODO Could probably be sets instead of arrays

    const _getMeta = (socket: _ClientWithId) => {
      const id = socket._miterClientId || addSocket(socket);
      return _socketIndex[id];
    };

    const removeSocketFromChannel = (socket: Client) => {
      const _socket = socket as _ClientWithId;
      const meta = _getMeta(_socket);
      const channelId = meta?.channelId;

      if (channelId) {
        if (_channelIndex[channelId]) {
          for (let i = 0; i < _channelIndex[channelId].clients.length; i++) {
            if (_channelIndex[channelId].clients[i] === socket) {
              // Remove the ith element from the array, thus removing the socket from the index.
              _channelIndex[channelId].clients.splice(i, 1);
              break;
            }
          }

          // Note that e.g., if there are timers out for operations on the channel they won't have a channel to
          // operate on.
          if (_channelIndex[channelId].clients.length === 0) delete _channelIndex[channelId];

          meta.channelId = null;
          this.handleChannelMemberChange(channelId, 'Decrease');
        } else {
          console.error(
            'Internal socket-server inconsistency: Found a channel for a socket but nothing in the channel index.'
          );
        }
      }
    };

    const addSocket = (socket: Client) => {
      const _socket = socket as _ClientWithId;
      const id = uuid();
      _socket._miterClientId = id;
      _socketIndex[id] = {userId: null, channelId: null, isAuthenticating: false, requestQueue: [], userInfo: {}};
      return id;
    };

    const removeSocket = (socket: Client) => {
      const _socket = socket as _ClientWithId;
      const id = _socket._miterClientId;
      if (id) {
        removeSocketFromChannel(_socket);
        delete _socket._miterClientId;
        delete _socketIndex[id];
      }
    };

    const addSocketToChannel = (channelId: string, socket: Client) => {
      const _socket = socket as _ClientWithId;
      const id = _socket._miterClientId || addSocket(_socket);
      const meta = _getMeta(_socket);

      removeSocketFromChannel(_socket);

      meta.channelId = channelId;
      if (!_channelIndex[channelId]) _channelIndex[channelId] = {clients: [], meta: new Map()};
      _channelIndex[channelId].clients.push(_socket);

      this.handleChannelMemberChange(channelId, 'Increase');
    };

    const getChannelForSocket = (socket: ws) => {
      const meta = _getMeta(socket as _ClientWithId);
      return meta.channelId;
    };

    const getSocketsForChannel = (channelId: string): Client[] => {
      return _channelIndex[channelId]?.clients || [];
    };

    const getUserForSocket = (socket: Client): SocketUser => {
      const meta = _getMeta(socket as _ClientWithId);
      return {userId: meta.userId, userInfo: meta.userInfo};
    };

    const setUserForSocket = (socket: Client, user: SocketUser) => {
      const meta = _getMeta(socket as _ClientWithId);
      meta.userId = user.userId;
      meta.userInfo = user.userInfo || {};
    };

    const getRequestQueueForSocket = (socket: Client) => {
      const meta = _getMeta(socket as _ClientWithId);
      if (!meta.requestQueue) meta.requestQueue = [];
      return meta.requestQueue;
    };

    const resetRequestQueueForSocket = (socket: Client) => {
      const meta = _getMeta(socket as _ClientWithId);
      meta.requestQueue = [];
    };

    const getIsAuthenticatingForSocket = (socket: Client) => {
      const meta = _getMeta(socket as _ClientWithId);
      return meta.isAuthenticating;
    };

    const setIsAuthenticatingForSocket = (socket: Client, isAuthValue: boolean) => {
      const meta = _getMeta(socket as _ClientWithId);
      meta.isAuthenticating = isAuthValue;
    };

    const setChannelInfo = (channelId: string, key: string, value: any) => {
      const channel = _channelIndex[channelId];
      if (!channel) {
        console.error(`Tried to set info for a nonexistent channel: ${channelId}`);
        return false;
      }

      channel.meta.set(key, value);
      return true;
    };

    const getChannelInfo = (channelId: string, key: string) => {
      const channel = _channelIndex[channelId];
      if (!channel) return undefined;
      return channel.meta.get(key);
    };

    return {
      addSocket,
      removeSocket,
      addSocketToChannel,
      removeSocketFromChannel,
      getChannelForSocket,
      getSocketsForChannel,
      getUserForSocket,
      setUserForSocket,
      getRequestQueueForSocket,
      resetRequestQueueForSocket,
      getIsAuthenticatingForSocket,
      setIsAuthenticatingForSocket,
      getChannelInfo,
      setChannelInfo,
    };
  })();

  setClientChannel = (client: Client, channelId: string | null) => {
    if (channelId) this.socketTable.addSocketToChannel(channelId, client);
    else this.socketTable.removeSocketFromChannel(client);
  };

  /*
   * Given a client/socket, get whatever channel (meeting) it's subscribed to, if any.
   * If you expect the client to have a channel under all non-error circumstances, use getExistingChannel().
   */
  getClientChannel = (client: Client) => {
    return this.socketTable.getChannelForSocket(client);
  };

  /*
   * Given a client/socket that we explicitly expect to be subscribed to a channel, get
   * that channel. Throws otherwise. If the client might not have a channel, use getClientChannel().
   */
  getExistingChannel = (client: Client): string => {
    const possibleChannel = this.getClientChannel(client);
    if (!possibleChannel) {
      throw new ValidationError("Tried to retrieve a socket channel that should exist but it didn't.");
    }

    return possibleChannel;
  };

  private endpointTable = (() => {
    // Currently we only permit one registered endpoint per request type. I can think of ways
    // we might want multiple, but until we do this is simpler and allows more error-checking.
    // Also: endpointIndex is not as type-safe on the key side as I'd like, but by encapsulating
    // it we do do the relevant type-checking.
    const endpointIndex: Record<string, Endpoint> = {};

    const add = (requestType: SocketRequestType, endpointFunction: Endpoint) => {
      if (endpointIndex[requestType]) throw new Error(`Attempt to add a duplicate socket endpoint for ${requestType}`);
      endpointIndex[requestType] = endpointFunction;
    };

    const get = (requestType: SocketRequestType) => endpointIndex[requestType] || null;

    return {add, get};
  })();

  on = (requestType: SocketRequestType, endpointFunction: Endpoint) => {
    this.endpointTable.add(requestType, endpointFunction);
  };

  /*
   * Send a message across a single socket.
   */
  send = (socket: Client, responseType: SocketResponseType, body: ResponseBody, requestId?: string) => {
    // log(`Sending ${responseType}`);
    const res: SocketResponseMessage = {responseType, body, requestId};
    socket.send(JSON.stringify(res));
  };

  /*
   * Send a message to all sockets on a channel.
   */
  broadcast = (channelId: string, responseType: SocketResponseType, body: ResponseBody, requestId?: string) => {
    // log(`Broadcasting ${responseType}`);
    if (channelId) {
      const sockets = this.socketTable.getSocketsForChannel(channelId);
      if (sockets.length) {
        sockets.forEach(client => {
          if (client.readyState === ws.OPEN) {
            this.send(client, responseType, body, requestId);
          }
        });
      } else {
        console.error('Attempted to broadcast to empty meeting.');
      }
    } else {
      console.error('Attempted to broadcast to nonexistent meeting ID.');
    }
  };

  private validateSocketMessage = (rawMessage: string): SocketRequestMessage | null => {
    const parsedMessage = JSON.parse(rawMessage);
    if (
      parsedMessage &&
      parsedMessage.requestType &&
      typeof parsedMessage.requestType === 'string' &&
      isValidUuid(parsedMessage.requestId, true) &&
      parsedMessage.body !== undefined
    ) {
      return parsedMessage;
    }
    console.error('Received an improperly-formatted socket message.');
    return null;
  };

  private validateAuthenticationRequest = (body: SocketRequestBody): AuthRequest => {
    if (!body) throw new ValidationError('Expected an authentication request, got something falsy.');
    if (typeof body.miterUserId !== 'string') {
      throw new ValidationError(`Expected an auth request body with a Miter user ID (got "${body.miterUserId}").`);
    }

    return {miterUserId: body.miterUserId};
  };

  //
  // Core logic for executing an incoming request. Helper function used by others.
  //
  private executeRequest = async (
    socketClient: Client,
    requestType: SocketRequestType,
    body: SocketRequestBody,
    requestId?: string
  ) => {
    const startTimestamp = Date.now();
    const endpoint = this.endpointTable.get(requestType);
    if (endpoint) {
      try {
        await endpoint(this, socketClient, body, requestId);
        logPerf(startTimestamp, `Completed ${requestType}${body ? ` - ${JSON.stringify(body)}` : ''}`);
      } catch (err) {
        Sentry.withScope(scope => {
          scope.setTransactionName(`[SOCKET] ${requestType}`);
          scope.setContext('user', this.getUserForClient(socketClient));
          scope.setContext('body', body);
          Sentry.captureException(err, scope);
        });

        console.error(err);
        const res: ErrorResponse = {description: `${err}`};
        this.send(socketClient, 'Error', res, requestId);
      }
    } else {
      console.warn('Received a socket request without a registered endpoint.');
    }
  };

  //
  // If we've queued requests while executing an authentication request, return to them.
  //
  private executeRequestQueue = (socketClient: Client) => {
    // log('Clearing request queue.');
    this.socketTable.getRequestQueueForSocket(socketClient).forEach(req => {
      this.executeRequest(socketClient, req.requestType, req.body, req.requestId);
    });
    this.socketTable.resetRequestQueueForSocket(socketClient);
  };

  // Participant / member / user stuff

  setAuthenticateUserCallback = (cb: AuthenticateUserCallback) => {
    this._authenticateCallback = cb;
  };

  setUserDidFinishAuthenticatingCallback = (cb: UserDidFinishAuthenticatingCallback) => {
    this._didFinishAuthCallback = cb;
  };

  onChannelMemberChange = (handler: ChannelMemberChangeHandler) => {
    this._channelMemberChangeHandlers.push(handler);
  };

  private handleChannelMemberChange = (channelId: string, changeType: MemberChangeType) => {
    this._channelMemberChangeHandlers.forEach(handler =>
      handler(this, channelId, this.getMembersForChannel(channelId), changeType)
    );
  };

  getMembersForChannel = (channelId: string): SocketUser[] => {
    const sockets = this.socketTable.getSocketsForChannel(channelId);
    return sockets.map(socket => this.getUserForClient(socket));
  };

  getInfoForChannel = (channelId: string, key: string) => {
    return this.socketTable.getChannelInfo(channelId, key);
  };

  setInfoForChannel = (channelId: string, key: string, value: any) => {
    return this.socketTable.setChannelInfo(channelId, key, value);
  };

  //
  // Get the user for a client.
  // TODO Authentication is an async operation, which means it's possible
  // to call this while authentication is in progress and get an out-of-date
  // result. I've minimized the chances of this by holding incoming socket
  // requests during auth, but a more robust approach would be to make this async
  // and hold its result during an ongoing auth request.
  //
  getUserForClient = (client: Client) => {
    return this.socketTable.getUserForSocket(client);
  };

  //
  // Regarding substituteMockWsServer: In order to run integration tests through the socket server,
  // we need to pass it a mock web socket. Since under normal operation we encapsulate creation
  // of the WS server inside this function, we offer an optional override parameter with which
  // to pass in that mock for testing only. For normal operation, treat this as a single-parameter
  // function.
  //
  constructor(appServer: Server, substituteMockWsServer?: ws.Server | null) {
    console.log('Constructing socket server.');

    const wsServer = substituteMockWsServer || new ws.Server({server: appServer});

    wsServer.on('connection', rawSocketClient => {
      // When we're testing with a mock wsServer, it doesn't have a clients property.
      console.log('Number of socket clients: ', wsServer.clients?.size || 'not available');
      const socketClient = rawSocketClient as Client;
      this.socketTable.addSocket(socketClient);

      socketClient.on('message', async (socketMessage: string) => {
        // Validate and parse incoming message
        const validatedMessage = this.validateSocketMessage(socketMessage);
        if (!validatedMessage) return;

        const {requestType, body, requestId} = validatedMessage;

        if (requestType === 'Authenticate') {
          this.socketTable.setIsAuthenticatingForSocket(socketClient, true);
          const {miterUserId} = this.validateAuthenticationRequest(body);

          if (this._authenticateCallback) {
            const authResult = await this._authenticateCallback(miterUserId || undefined);
            this.socketTable.setUserForSocket(socketClient, authResult);
            if (this._didFinishAuthCallback) this._didFinishAuthCallback(this, socketClient, authResult);
          } else {
            console.warn('SocketServer got an attempted authentication with no registered auth callback.');
            this.socketTable.setUserForSocket(socketClient, {userId: null, userInfo: {}});
          }

          this.socketTable.setIsAuthenticatingForSocket(socketClient, false);
          this.executeRequestQueue(socketClient); // Execute any requests that have come in while authenticating
        } else if (requestType !== 'KeepAlive') {
          // If we're in the midst of authenticating, queue until we're done; otherwise execute immediately.
          // TODO this is a quick hacky implementation of auth; revisit soon (7/2021)
          if (this.socketTable.getIsAuthenticatingForSocket(socketClient)) {
            // log(`Queuing ${requestType} request while authenticating.`);
            this.socketTable.getRequestQueueForSocket(socketClient).push({requestType, body, requestId});
          } else {
            this.executeRequest(socketClient, requestType, body, requestId);
          }
        }
      });

      socketClient.on('close', _statusCode => {
        // statusCode might be useful someday!
        this.socketTable.removeSocket(socketClient);
        console.log('Number of clients: ', wsServer.clients.size);
      });
    });
  }
}
