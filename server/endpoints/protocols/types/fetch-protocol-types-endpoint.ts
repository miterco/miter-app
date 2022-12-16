import {fetchAllProtocolTypes} from '../../../data/protocol/types/fetch-all-protocol-types';
import socketEndpoint from '../../../server-core/socket/socket-endpoint';

export default socketEndpoint(async (_request, response) => {
  const protocolTypes = await fetchAllProtocolTypes();

  const body = {
    protocolTypes: protocolTypes.map(({id, name, description, data, phases}) => ({
      id,
      name,
      description,
      data,
      phases,
    })),
  };

  response.send('AllProtocolTypes', body, {includeRequestId: true});
});
