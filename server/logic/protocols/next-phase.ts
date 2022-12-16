import {fetchProtocolItemsByPhaseId} from '../../data/protocol/items/fetch-all-protocol-items';
import {Person, Protocol, ProtocolPhaseType, UserOrGuest} from '../../../common/SharedTypes';
import {fetchAllProtocolItemActionsByProtocolId} from '../../data/protocol/actions/fetch-all-protocol-item-actions';
import {validateUserOrGuest} from 'miter-common/CommonUtil';
import {SocketServer, SocketUser} from '../../server-core/socket-server';

export const isCurrentPhaseCompleted = async (protocol: Protocol, meetingId: string, server: SocketServer) => {
  if (!protocol.currentPhase?.id) throw new Error('Received a protocol missing the current phase id');
  if (!protocol?.id) throw new Error('Received a protocol without an id');
  const members: SocketUser[] = await server.getMembersForChannel(meetingId);
  const participants: Person[] = members.map(participant => validateUserOrGuest(participant.userInfo));
  const loggedInParticipants = participants.filter(({userId}) => userId);

  switch (protocol?.currentPhase?.type) {
    case ProtocolPhaseType.SingleResponse: {
      // Require every participant to have responded.
      const items = await fetchProtocolItemsByPhaseId(protocol.id, protocol.currentPhase.id);
      return items.length >= loggedInParticipants.length;
    }

    case ProtocolPhaseType.MultipleResponses: {
      // Ensure there are the required minimum number of responses.
      const items = await fetchProtocolItemsByPhaseId(protocol.id, protocol.currentPhase.id);
      return items.length >= protocol.currentPhase.data.minItems;
    }

    case ProtocolPhaseType.VoteOnContentList: {
      // Ensure every participant used their votes.
      const actions = await fetchAllProtocolItemActionsByProtocolId(protocol.id);
      const allowedVotesPerUser = Math.ceil((protocol?.items?.length ?? 0) / 3);

      return actions.length === allowedVotesPerUser * loggedInParticipants.length;
    }

    case ProtocolPhaseType.SoloMultipleResponses: {
      // Require every attendee to have created at least one item.
      const items = await fetchProtocolItemsByPhaseId(protocol.id, protocol.currentPhase.id);

      return loggedInParticipants.every(participant => items.find(item => item.creatorId === participant.userId));
    }

    default:
      return true;
  }
};
