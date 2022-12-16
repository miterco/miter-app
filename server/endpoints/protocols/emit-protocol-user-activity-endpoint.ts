import socketEndpoint from '../../server-core/socket/socket-endpoint';

/**
 * This endpoint is used to broadcast the user activity in protocols.
 *
 * The client uses this endpoint to signal everyone that they are actively working on the protocol (typing, voting,
 * etc). This endpoint then broadcasts the user activity to everyone in the meeting.
 */
export default socketEndpoint(async (_request, response) => {
  response.broadcast('ProtocolUserActivity', {userId: _request.userId});
});
