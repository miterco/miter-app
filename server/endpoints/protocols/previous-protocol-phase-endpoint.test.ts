import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestMeeting, insertTestProtocol} from '../../testing/generate-test-data';
import {nextProtocolPhaseEndpoint} from './next-protocol-phase-endpoint';
import {previousProtocolPhaseEndpoint as previousProtocolPhase} from './previous-protocol-phase-endpoint';

// When testing next/previous protocol phase endpoint we need to wait a 1 second delay
const delayRequest = () => new Promise<void>(res => setTimeout(res, 1100));

describe('previousProtocolPhase', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;

  it('should not allow to move phase too quickly', async () => {
    const {protocol, deleteTestProtocol} = await insertTestProtocol('protocolMovePhaseQuickly', {
      phases: ['Phase 1', 'Phase 2', 'Phase 3'],
    });
    const nextRequestId = uuid();
    const requestId = uuid();
    const secondRequestId = uuid();
    const payload = {protocolId: protocol!.id};
    const meeting = await insertTestMeeting('nextProtocolPhase - Completed Protocol');

    (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
    (server.getMembersForChannel as jest.Mock).mockReturnValue([]);
    await nextProtocolPhaseEndpoint(server, client, payload, nextRequestId);

    await delayRequest();
    previousProtocolPhase(server, client, payload, requestId);
    await previousProtocolPhase(server, client, payload, secondRequestId);

    const updatedProtocol = broadcast.mock.calls[1][2].updated[0];

    expect(updatedProtocol?.currentPhaseIndex).toBe(0);
    await deleteTestProtocol();
  });

  it('should not allow moving phase when already at first phase', async () => {
    const {protocol, deleteTestProtocol} = await insertTestProtocol('protocolFirstPhase', {phases: ['Phase 1']});
    const requestId = uuid();
    const payload = {protocolId: protocol!.id};

    await expect(previousProtocolPhase(server, client, payload, requestId)).rejects.toThrow();
    await deleteTestProtocol();
  });
});
