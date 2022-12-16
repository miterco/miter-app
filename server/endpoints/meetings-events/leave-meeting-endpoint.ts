import {Endpoint} from '../../server-core/socket-server';

/*
 * Allows the client to inform the server that it's left a meeting. Not necessary when joining another meeting or
 * exiting the app--the leave action is implicit both in another join, and in closing the socket.
 */
export const leaveMeetingEndpoint: Endpoint = async (server, client) => {
  server.setClientChannel(client, null); // Also takes care of broadcasting changes to other participants

  // Feels odd not to send anything back to the client, but the client knows it's leaving the meeting and "Error:
  // Client failed to leave meeting" is pretty inside-baseball.
  server.send(client, 'LeftMeeting', {});
};