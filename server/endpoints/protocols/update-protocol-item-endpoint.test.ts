import {uuid} from 'miter-common/CommonUtil';

import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestProtocol} from '../../testing/generate-test-data';

import updateProtocolItemEndpoint from './update-protocol-item-endpoint';

describe('updateProtocolItem', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();

  beforeEach(() => {
    jest.clearAllMocks();
    (server.getExistingChannel as jest.Mock).mockReturnValue(uuid());
  });

  it('should fail when the protocol item ID is not present in the payload', async () => {
    const payload = {text: 'Some other text'};
    await expect(updateProtocolItemEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should fail when the protocol item ID is not valid', async () => {
    const payload = {text: 'Some other text', protocolItemId: uuid()};
    await expect(updateProtocolItemEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should update the given protocol item text', async () => {
    const {protocolItems, deleteTestProtocol} = await insertTestProtocol('updateProtocolItem', {
      items: ['Item Text'],
      phases: ['Phase 1'],
    });
    const {id: protocolItemId} = protocolItems[0];

    const payload = {protocolItemId, text: 'Some other text'};
    await updateProtocolItemEndpoint(server, client, payload);

    const fetchedProtocolItem = await fetchProtocolItemById(protocolItemId);
    expect(fetchedProtocolItem?.text).toEqual(payload.text);
    deleteTestProtocol();
  });

  it('should send a ProtocolItem response with all the protocol items', async () => {
    const {protocolItems, deleteTestProtocol} = await insertTestProtocol('updateProtocolItem', {
      items: ['Item Text'],
      phases: ['Phase 1'],
    });
    const payload = {
      protocolItemId: protocolItems[0].id,
      text: 'Some other text',
    };
    await updateProtocolItemEndpoint(server, client, payload);

    const broadcast = server.broadcast as any;
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][1]).toBe('ProtocolItem');
    deleteTestProtocol();
  });
});
