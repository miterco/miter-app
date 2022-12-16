import Joi from 'joi';
import {EmitProtocolUserStateRequest} from 'miter-common/SharedTypes';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import withSocketUser from '../../server-core/socket/middlewares/with-socket-user';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

/**
 * This endpoint is used to broadcast the user solo state to other protocol players.
 */
export default socketEndpoint(
  messageBodySchema({
    isDone: Joi.boolean().required(),
  }),
  withSocketUser,
  async ({body, user}, response) => {
    if (!user?.id) throw new Error('Only authenticated users can emit protocol user state.');

    const {isDone} = body as EmitProtocolUserStateRequest;
    response.broadcast('ProtocolUserState', {userId: user.id, isDone});
  }
);
