import {uuid} from 'miter-common/CommonUtil';
import {fetchProtocolItemById} from '../../data/protocol/items/fetch-protocol-item';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestMeeting, insertTestProtocol} from '../../testing/generate-test-data';
import prioritizeProtocolItemEndpoint from './prioritize-protocol-item-endpoint';

describe('prioritizeProtocolItemEndpoint', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;

  beforeAll(async () => {
    const meeting = await insertTestMeeting('prioritizeProtocolItemEndpoint');

    (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when the protocol item ID is not present in the payload', async () => {
    const payload = {shouldPrioritize: true};
    await expect(prioritizeProtocolItemEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should fail when the protocol item ID is not valid', async () => {
    const payload = {shouldPrioritize: true, protocolItemId: uuid()};
    await expect(prioritizeProtocolItemEndpoint(server, client, payload)).rejects.toThrow();
  });

  it('should update the given protocol item isForcefullyPrioritized', async () => {
    const {protocolItems} = await insertTestProtocol('prioritizeProtocolItemEndpoint', {
      items: ['Item Text'],
      phases: ['Phase 1'],
    });
    const {id: protocolItemId} = protocolItems[0];

    const payload = {protocolItemId, shouldPrioritize: true};
    await prioritizeProtocolItemEndpoint(server, client, payload);

    const fetchedProtocolItem = await fetchProtocolItemById(protocolItemId);
    expect(fetchedProtocolItem?.isForcefullyPrioritized).toBe(true);
    expect(fetchedProtocolItem?.isForcefullyDeprioritized).toBe(false);
  });

  it('should update the given protocol item isForcefullyDeprioritized', async () => {
    const {protocolItems} = await insertTestProtocol('prioritizeProtocolItemEndpoint', {
      items: ['Item Text'],
      phases: ['Phase 1'],
    });
    const {id: protocolItemId} = protocolItems[0];

    const payload = {protocolItemId, shouldPrioritize: false};
    await prioritizeProtocolItemEndpoint(server, client, payload);

    const fetchedProtocolItem = await fetchProtocolItemById(protocolItemId);
    expect(fetchedProtocolItem?.isForcefullyPrioritized).toBe(false);
    expect(fetchedProtocolItem?.isForcefullyDeprioritized).toBe(true);
  });

  it('should send a ProtocolItem response with the updated protocol item', async () => {
    const {protocolItems} = await insertTestProtocol('updateProtocolItem', {items: ['Item Text'], phases: ['Phase 1']});
    const payload = {protocolItemId: protocolItems[0].id, shouldPrioritize: true};
    await prioritizeProtocolItemEndpoint(server, client, payload);

    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][1]).toBe('ProtocolItem');
  });
});
