import {uuid} from 'miter-common/CommonUtil';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {insertTestMeeting, insertTestProtocol} from '../../testing/generate-test-data';
import {nextProtocolPhaseEndpoint} from './next-protocol-phase-endpoint';

describe('nextProtocolPhase', () => {
  const server = mockSocketServer();
  const client = mockWebSocket();
  const broadcast = server.broadcast as any;
  let testData: any;

  beforeAll(async () => {
    jest.resetAllMocks();
    testData = await insertTestProtocol('nextProtocolPhase - Simultaneous Next Phase Requests', {
      phases: ['Phase 1', 'Phase 2'],
    });
    const meeting = await insertTestMeeting('nextProtocolPhase - Completed Protocol');
    (server.getMembersForChannel as jest.Mock).mockReturnValue([]);
    (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
    (server.getUserForClient as jest.Mock).mockReturnValue({userId: testData.protocol?.creatorId});
  });

  afterAll(() => {
    testData.deleteTestProtocol();
  });

  it('should not allow to move phase too quickly', async () => {
    const {protocol} = testData;
    const requestId = uuid();
    const secondRequestId = uuid();
    const payload = {protocolId: protocol?.id};

    await Promise.all([
      nextProtocolPhaseEndpoint(server, client, payload, requestId),
      nextProtocolPhaseEndpoint(server, client, payload, secondRequestId),
    ]);

    const updatedProtocol = broadcast.mock.calls[0][2].updated[0];
    expect(updatedProtocol?.currentPhaseIndex).toBe(1);
  });

  it("should allow moving phase quickly if it's the last phase", async () => {
    const {protocol} = testData;
    const requestId = uuid();
    const secondRequestId = uuid();
    const payload = {protocolId: protocol?.id};

    // We need to wait a second so that the request doesn't get ignored
    await new Promise(r => setTimeout(r, 1100));

    await Promise.all([
      nextProtocolPhaseEndpoint(server, client, payload, requestId),
      nextProtocolPhaseEndpoint(server, client, payload, secondRequestId),
    ]);

    const updatedProtocol = broadcast.mock.calls[2][2].updated[0];
    expect(updatedProtocol?.isCompleted).toBe(true);
  });
});
