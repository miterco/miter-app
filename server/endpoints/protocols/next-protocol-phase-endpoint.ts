import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {updateProtocolById} from '../../data/protocol/update-protocol';
import {fetchProtocolById} from '../../data/protocol/fetch-protocol';
import {StrProtocols} from 'miter-common/Strings';
import {MeetingResponse, Protocol, ProtocolPhaseChangeRequest} from 'miter-common/SharedTypes';
import {updateMeeting} from '../../data/meetings-events/update-meeting';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {isCurrentPhaseCompleted} from '../../logic/protocols/next-phase';

export const nextProtocolPhaseEndpoint = socketEndpoint(
  messageBodySchema({
    protocolId: Joi.string().guid().required(),
  }),
  async (request, response): Promise<Protocol | void> => {
    const {protocolId} = request.body as ProtocolPhaseChangeRequest;
    const protocol = await fetchProtocolById(protocolId);
    const meeting = await fetchMeeting(request.meetingId);

    if (!protocol) throw new Error(`${StrProtocols.Protocol} not found`);
    if (!meeting) throw new Error('Meeting not found');
    if (!protocol.type) throw new Error('Received a protocol without a type');
    if (!protocol.type.phases) throw new Error('Received a protocol without any phase');

    const isLastPhase = protocol.currentPhaseIndex + 1 >= protocol.type.phases.length;

    if (protocol.lastPhaseChangeDate && !isLastPhase) {
      // if last phase change date is less than 1 second ago, don't allow
      const OneSecond = 1000;
      const timeSinceLastPhaseChange = Date.now() - protocol.lastPhaseChangeDate.getTime();
      if (timeSinceLastPhaseChange < OneSecond) return;
    }

    const protocolOnNextPhase = await updateProtocolById(protocolId, {
      currentPhaseIndex: !isLastPhase ? protocol.currentPhaseIndex + 1 : undefined,
      isCompleted: protocol.isCompleted || isLastPhase,
      lastPhaseChangeDate: new Date(),
    });

    // OPTIMIZE: There probably is a way to do this without a second update query.
    const updatedProtocol: Protocol = await updateProtocolById(protocolId, {
      readyForNextPhase: await isCurrentPhaseCompleted(protocolOnNextPhase, request.meetingId, request.server),
    });

    response.broadcast('Protocol', {updated: [updatedProtocol]});

    if (meeting.currentProtocolId === protocolId && updatedProtocol.isCompleted) {
      // Since this protocol is done, the meeting participants are free to create another protocol.
      const updatedMeeting = await updateMeeting({id: request.meetingId, currentProtocolId: null});
      response.broadcast<MeetingResponse>('Meeting', {meeting: updatedMeeting});
    }

    return updatedProtocol;
  }
);
