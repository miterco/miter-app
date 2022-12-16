import Joi from 'joi';
import {RequestProtocolUserStateRequest} from 'miter-common/SharedTypes';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

/**
 * This endpoint is used to let everyone in the meeting know that they have to emit their current solo state.
 *
 * The session ID included in the payload of the request identifies a tab/window in which the app is open. Since
 * the `ProtocolUserStateRequest` message will be broadcasted all users (including the one requesting it), the client will use this
 * information to determine if this request to emit the protocol state was initiated from that current session. If it was, this
 * request will be ignored.
 *
 * A user's solo-state is tied to a specific protocol. When they report their current solo-state, they also need to specify which
 * protocol they are reporting state for. Including such information in the message allows the client to decide whether to process
 * the reported user state or not, depending on whether or not it belongs to their currently open protocol.
 */
export default socketEndpoint(
  messageBodySchema({
    sessionId: Joi.string().guid().required(),
    protocolId: Joi.string().guid().required(),
  }),
  async (request, response) => {
    const {sessionId, protocolId} = request.body as RequestProtocolUserStateRequest;
    response.broadcast('ProtocolUserStateRequest', {sessionId: sessionId, protocolId: protocolId});
  }
);
