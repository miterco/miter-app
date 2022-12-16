import {fetchProtocolsByMeetingId} from '../../data/protocol/fetch-protocol';
import socketEndpoint from '../../server-core/socket/socket-endpoint';

export default socketEndpoint(async (request, response) => {
  const protocols = await fetchProtocolsByMeetingId(request.meetingId);

  response.send('AllMeetingProtocols', {protocols});
});
