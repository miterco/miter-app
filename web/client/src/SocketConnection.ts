import {isValidUuid} from 'miter-common/CommonUtil';
import {
  AuthRequest,
  SocketRequestBody,
  SocketRequestMessage,
  SocketRequestType,
  ResponseBody,
  SocketResponseMessage,
  SocketResponseType,
} from 'miter-common/SharedTypes';
import {ValidationError} from 'miter-common/SharedTypes';
import {v4 as uuid} from 'uuid';
import * as Util from './Utils';
import cookies from 'js-cookie';
import {getAuthenticationCheck} from 'model/UserApi';

const isLocalEnv = document.location.hostname === 'localhost';
const socketHost = isLocalEnv ? 'ws://localhost:3000' : `wss://${document.location.host}`; // TODO Can this use the React proxy host?

export type SocketConnectionListener = (body: ResponseBody) => void;
export type ReconnectListener = () => void;

class SocketConnection {
  private socket: WebSocket | null = null;
  private isAcceptingRequests: boolean = false;
  private requestQueue: Array<SocketRequestMessage> = [];
  private responderQueue: Record<string, {resolve: SocketConnectionListener; reject: (err: string) => void}> = {};
  private listeners: Record<string, Set<SocketConnectionListener>> = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepAliveTimer: number | null = null;
  private reconnectListener: ReconnectListener | null = null;

  private validateSocketResponseMessage = (msgData: any): SocketResponseMessage => {
    if (!msgData || msgData === 'null') throw new ValidationError('Socket received a message without any data.');
    const parsed = JSON.parse(msgData);
    if (typeof parsed.responseType !== 'string') {
      throw new ValidationError(`Socket received a message with a non-string response type: ${parsed.responseType}`);
    }
    if (!isValidUuid(parsed.requestId, true)) {
      throw new ValidationError(`Socket received a message with invalid request ID: ${parsed.requestId}`);
    }
    if (parsed.body !== null && typeof parsed.body !== 'object') {
      throw new ValidationError(`Socket received an unexpected message body: ${parsed.body}`);
    }
    return parsed;
  };

  connect = (reconnecting: boolean = false) => {
    if (this.socket && this.socket.readyState === 1 /* OPEN */) {
      // TODO is there an edge case around states other than open and closed here?
      Util.log('We needed a socket, and we already had one.');
    } else {
      Util.log('We need a new socket. Setting it up.');
      this.socket = new WebSocket(socketHost!);

      this.socket.onopen = async () => {
        Util.log(`Socket connected. ${this.requestQueue.length} in queue.`);
        this.keepAliveTimer = window.setInterval(() => this.executeRequest('KeepAlive', {}), 30000);

        await this.authenticate();

        if (reconnecting && this.reconnectListener) {
          this.reconnectListener();
        }

        // Stop queueing
        this.isAcceptingRequests = true;

        // TODO this could get more robust and there's probably a race condition with the above.
        const oldQueue = this.requestQueue;
        this.requestQueue = [];
        oldQueue.forEach(socketMessage => {
          this.executeRequest(socketMessage.requestType, socketMessage.body, socketMessage.requestId);
        });
      };

      this.socket.onmessage = event => {
        const msg = this.validateSocketResponseMessage(event.data);
        this.handleIncoming(msg);
      };

      this.socket.onclose = event => {
        this.isAcceptingRequests = false;
        Util.log('Socket closed. Reconnecting...');
        if (this.keepAliveTimer) {
          window.clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = null;
        }
        this.reconnectSocket();
      };

      this.socket.onerror = () => {
        Util.log('Socket error.');
      };
    }
  };

  private reconnectSocket = () => {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        Util.log('Reopening socket...');
        this.reconnectTimer = null;
        this.connect(true);
      }, 3000);
    }
  };

  /*
   * Handles all incoming requests from the server. If there's a request ID and handler waiting for it, executes that
   * handler (that is, an explicit response to a request that wanted it). For normal response types, it then goes on
   * to trigger any registered listener. This means you *can* have a single message trigger a direct response *and* a
   * listener, though I don't think we do that right now. So:
   *
   * - Normal incoming message w/ request ID: calls a response handler for the ID when present, and triggers any listeners.
   * - Normal incoming without ID: triggers any listeners.
   * - DirectResponse w/ request ID: calls a response handler when present, no listeners triggered
   * - DirectResponse w/o ID: should produce a warning.
   * - Error message: triggers a reject handler when present, otherwise errors to console
   *
   */
  private handleIncoming = (socketMessage: SocketResponseMessage) => {
    const responseHandlers = socketMessage.requestId ? this.responderQueue[socketMessage.requestId] : null;
    if (socketMessage.requestId) delete this.responderQueue[socketMessage.requestId];

    const {responseType} = socketMessage;
    if (responseType === 'Error') {
      if (responseHandlers) responseHandlers.reject(socketMessage.body?.description);
      else console.error(`Received server error: ${socketMessage.body?.description}`);
    } else if (responseType === 'DirectResponse') {
      if (responseHandlers) responseHandlers.resolve(socketMessage.body);
      else {
        console.warn('Received a DirectResponse socket message without a matching handler:');
        console.warn(socketMessage);
      }
    } else {
      if (responseHandlers) responseHandlers.resolve(socketMessage.body);
      this.trigger(responseType, socketMessage.body);
    }

    if (window.Debug) console.log(`%c=> [WebSocket Receive] - ${responseType}`, 'color: #0057e6; font-weight: 800');
    if (window.Debug) console.log('  - [WebSocket Response]', socketMessage.body);
  };

  /*
   * Actually executes a request, with a few more parameters than we expose publicly:
   * - requestId allows the caller to pass in a preexisting request ID instead of just creating one
   * - bypassQueue assumes the socket is open and we want to send the request immediately. For private use only (so far,
   *   just for sending authentication as soon as the socket opens).
   */
  private executeRequest = (
    requestType: SocketRequestType,
    body?: SocketRequestBody,
    requestId?: string,
    bypassQueue: boolean = false
  ) => {
    if (!this.socket) this.connect();

    if (!requestId) requestId = uuid();
    const socketMessage: SocketRequestMessage = {requestType, body: body ?? null, requestId};
    if (this.isAcceptingRequests || bypassQueue) {
      this.socket!.send(JSON.stringify(socketMessage));
    } else {
      this.requestQueue.push(socketMessage);
    }
    if (window.Debug && requestType !== 'KeepAlive') {
      console.log(`%c=> [WebSocket Send] - ${requestType}`, 'color: #7f8fa6; font-weight: 800');
      if (body) console.log('  - [WebSocket Message]', body);
    }
    return requestId;
  };

  request = <RequestDataType = SocketRequestBody>(requestType: SocketRequestType, body?: RequestDataType) => {
    this.executeRequest(requestType, body);
  };

  requestResponse = <RequestDataType = SocketRequestBody>(requestType: SocketRequestType, body?: RequestDataType) => {
    const promise = new Promise((resolve: SocketConnectionListener, reject: (err: string) => void) => {
      const requestId = this.executeRequest(requestType, body);
      this.responderQueue[requestId] = {resolve, reject};
    });
    return promise;
  };

  authenticate = async () => {
    const {userId} = await getAuthenticationCheck();

    if (userId) {
      const body: AuthRequest = {miterUserId: userId};
      this.executeRequest('Authenticate', body, undefined, true);
    }
  };

  setReconnectListener = (listener: ReconnectListener | null) => {
    this.reconnectListener = listener;
  };

  on = (responseType: SocketResponseType, listener: SocketConnectionListener) => {
    if (responseType === 'Error' || responseType === 'DirectResponse') {
      console.error(`Attempted to register a listener for ${responseType} messages, which is not permitted.`);
      return;
    }
    if (!this.listeners[responseType]) this.listeners[responseType] = new Set();
    this.listeners[responseType].add(listener);
  };

  off = (responseType: SocketResponseType, listener: SocketConnectionListener) => {
    if (responseType === 'Error' || responseType === 'DirectResponse') {
      console.error(`Attempted to remove a listener for ${responseType} messages, which should not exist.`);
    }

    const theseListeners = this.listeners[responseType];
    if (theseListeners) {
      const deleteResult = theseListeners.delete(listener);
      if (!deleteResult) Util.error('SocketConnection tried to delete a nonexistent listener.');
    }
  };

  isConnected = () => {
    return Boolean(this.socket);
  };

  private trigger = (responseType: string, body: ResponseBody) => {
    if (this.listeners[responseType]) {
      this.listeners[responseType].forEach(listener => {
        listener(body);
      });
    } else {
      Util.log(`Received unexpected message type: ${responseType}`);
    }
  };
}

const sharedInstance = new SocketConnection();
export default sharedInstance;
