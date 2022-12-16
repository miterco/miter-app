import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {updateProtocolById} from '../../data/protocol/update-protocol';
import {fetchProtocolById} from '../../data/protocol/fetch-protocol';
import {ProtocolPhaseChangeRequest} from 'miter-common/SharedTypes';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';
import {isCurrentPhaseCompleted} from '../../logic/protocols/next-phase';

export const previousProtocolPhaseEndpoint = socketEndpoint(
  messageBodySchema({
    protocolId: Joi.string().guid().required(),
  }),
  async (request, response) => {
    const {protocolId} = request.body as ProtocolPhaseChangeRequest;
    const protocol = await fetchProtocolById(protocolId);
    if (!protocol) throw new Error('Protocol not found');

    if (protocol.lastPhaseChangeDate) {
      // if last phase change date is less than 1 second ago, don't allow
      const OneSecond = 1000;
      const timeSinceLastPhaseChange = Date.now() - protocol.lastPhaseChangeDate.getTime();

      if (timeSinceLastPhaseChange < OneSecond) return;
    }

    if (protocol.currentPhaseIndex === 0) throw new Error('Already at first phase');

    const protocolOnPrevPhase = await updateProtocolById(protocolId, {
      currentPhaseIndex: protocol.currentPhaseIndex - 1,
      lastPhaseChangeDate: new Date(),
    });

    // OPTIMIZE: There probably is a way to do this without a second update query.
    const updatedProtocol = await updateProtocolById(protocolId, {
      readyForNextPhase: await isCurrentPhaseCompleted(protocolOnPrevPhase, request.meetingId, request.server),
    });

    response.broadcast('Protocol', {updated: [updatedProtocol]});
  }
);
