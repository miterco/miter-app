import {validateUserOrGuest} from 'miter-common/CommonUtil';
import {Person, PeopleResponse, UserOrGuest} from 'miter-common/SharedTypes';
import {fetchUserByMiterId} from '../data/people/fetch-user';
import {setMeetingIdle} from '../data/meetings-events/set-meeting-idle';
import {userFromUserRecordType} from '../data/data-util';
import {
  AuthenticateUserCallback,
  ChannelMemberChangeHandler,
  SocketServer,
  UserDidFinishAuthenticatingCallback,
} from './socket-server';

// Endpoints.
import {
  cancelChangeMeetingPhaseEndpoint,
  changeMeetingPhaseEndpoint,
} from '../endpoints/meetings-events/change-meeting-phase-endpoint';
import {updateMeetingEndpoint} from '../endpoints/meetings-events/update-meeting-endpoint';
import {joinMeetingEndpoint} from '../endpoints/meetings-events/join-meeting-endpoint';
import {createNoteEndpoint} from '../endpoints/notes-items/create-note-endpoint';
import {createSummaryItemEndpoint} from '../endpoints/notes-items/create-summary-item-endpoint';
import {deleteNoteEndpoint} from '../endpoints/notes-items/delete-note-endpoint';
import {updateNoteEndpoint} from '../endpoints/notes-items/update-note-endpoint';
import {updateSummaryItemEndpoint} from '../endpoints/notes-items/update-summary-item-endpoint';
import {fetchAllNotesEndpoint} from '../endpoints/notes-items/fetch-all-notes-endpoint';
import {fetchAllSummaryItemsEndpoint} from '../endpoints/notes-items/fetch-all-summary-items-endpoint';
import {pinNoteEndpoint} from '../endpoints/notes-items/pin-note-endpoint';
import {deleteSummaryItemEndpoint} from '../endpoints/notes-items/delete-summary-item-endpoint';
import {createTopicEndpoint} from '../endpoints/topics/create-topic-endpoint';
import {deleteTopicEndpoint} from '../endpoints/topics/delete-topic-endpoint';
import {updateTopicEndpoint} from '../endpoints/topics/update-topic-endpoint';
import {fetchAllTopicsEndpoint, fetchPriorTopicsEndpoint} from '../endpoints/topics/fetch-topics-endpoint';
import {setCurrentTopicForMeetingEndpoint} from '../endpoints/topics/set-current-topic-for-meeting-endpoint';
import {fetchAllRelevantPeopleEndpoint} from '../endpoints/people/fetch-all-relevant-people-endpoint';
import sendSummaryEmailEndpoint from '../endpoints/send-summary-email-endpoint';
import {fetchPriorMeetingsEndpoint} from '../endpoints/meetings-events/fetch-prior-meeting-list-endpoint';
import {copyPriorTopicsEndpoint} from '../endpoints/topics/copy-prior-topics-endpoint';
import {sendFeedbackEndpoint} from '../endpoints/send-feedback-endpoint';
import {fetchTasksForUserEndpoint} from '../endpoints/notes-items/fetch-tasks-for-user-endpoint';
import {leaveMeetingEndpoint} from '../endpoints/meetings-events/leave-meeting-endpoint';
import fetchProtocolTypesEndpoint from '../endpoints/protocols/types/fetch-protocol-types-endpoint';
import createProtocolEndpoint from '../endpoints/protocols/create-protocol-endpoint';
import {nextProtocolPhaseEndpoint} from '../endpoints/protocols/next-protocol-phase-endpoint';
import {previousProtocolPhaseEndpoint} from '../endpoints/protocols/previous-protocol-phase-endpoint';
import fetchMeetingProtocolsEndpoint from '../endpoints/protocols/fetch-meeting-protocols-endpoint';
import createProtocolItemEndpoint from '../endpoints/protocols/create-protocol-item-endpoint';
import emitProtocolUserActivityEndpoint from '../endpoints/protocols/emit-protocol-user-activity-endpoint';
import updateProtocolItemEndpoint from '../endpoints/protocols/update-protocol-item-endpoint';
import createProtocolItemActionEndpoint from '../endpoints/protocols/create-protocol-item-action-endpoint';
import deleteProtocolItemActionEndpoint from '../endpoints/protocols/delete-protocol-item-action-endpoint';
import emitProtocolUserStateEndpoint from '../endpoints/protocols/emit-protocol-user-state-endpoint';
import requestProtocolUserStateEndpoint from '../endpoints/protocols/request-protocol-user-state-endpoint';
import deleteProtocolEndpoint from '../endpoints/protocols/delete-protocol-endpoint';
import prioritizeProtocolItemEndpoint from '../endpoints/protocols/prioritize-protocol-item-endpoint';
import deleteProtocolItemEndpoint from '../endpoints/protocols/delete-protocol-item-endpoint';
import fetchUserAddressBookEndpoint from '../endpoints/people/fetch-user-address-book-endpoint';
import sendInvitesEndpoint from '../endpoints/send-invites-endpoint';
import createProtocolItemGroupEndpoint from '../endpoints/protocols/create-protocol-item-group-endpoint';
import updateProtocolItemGroupEndpoint from '../endpoints/protocols/update-protocol-item-group-endpoint';
import fetchNonUsersFromInviteeListEndpoint from '../endpoints/people/fetch-non-users-from-invitee-list-endpoint';
import updateMultipleProtocolItemsGroupEndpoint from '../endpoints/protocols/update-multiple-protocol-items-group-endpoint';
import {fetchMeeting} from '../data/meetings-events/fetch-meeting';
import {isCurrentPhaseCompleted} from '../logic/protocols/next-phase';
import {updateProtocolById} from '../data/protocol/update-protocol';
import {fetchProtocolById} from '../data/protocol/fetch-protocol';

type AuthResult = {userId: string | null; userInfo: UserOrGuest};

const authenticateSocketUser: AuthenticateUserCallback = async (
  miterUserId: string | undefined
): Promise<AuthResult> => {
  const user = miterUserId ? await fetchUserByMiterId(miterUserId) : null;

  return {
    userId: user?.id || null,
    userInfo: user ? userFromUserRecordType(user) : {},
  };
};

//
// Socket-server callback for post-auth (success or failure)
//
const socketUserFinishedAuthenticating: UserDidFinishAuthenticatingCallback = (server, client, socketUser) => {
  const user = validateUserOrGuest(socketUser.userInfo);
  server.send(client, 'CurrentUser', user);
};

export const handleParticipantsChange: ChannelMemberChangeHandler = async (server, meetingId, members, changeType) => {
  // Any User or GuestUser is a Person.
  const participants: Person[] = members.map(participant => validateUserOrGuest(participant.userInfo));
  const res: PeopleResponse = {people: participants};
  server.broadcast(meetingId, 'ParticipantsChanged', res);
  const meeting = await fetchMeeting(meetingId);

  if (meeting?.currentProtocolId) {
    const meetingProtocol = await fetchProtocolById(meeting?.currentProtocolId);
    if (meetingProtocol) {
      const readyForNextPhase = await isCurrentPhaseCompleted(meetingProtocol, meetingId, server);
      if (readyForNextPhase !== meetingProtocol.readyForNextPhase) {
        const updatedProtocol = await updateProtocolById(meeting.currentProtocolId, {
          readyForNextPhase,
        });

        server.broadcast(meetingId, 'Protocol', {updated: [updatedProtocol]});
      }
    }
  }

  // If everyone has left the meeting, register that in the DB; if someone came back, register that too.
  if (changeType === 'Increase' && members.length === 1) {
    // Nobody was here and now somebody is
    // TODO: We get one unnecessary DB call here when the first person joins. Probably the right answer is to do this
    // via in-memory cache rather than DB.
    setMeetingIdle(meetingId, false); // Intentionally not awaiting
  } else if (changeType === 'Decrease' && members.length === 0) {
    setMeetingIdle(meetingId, true); // Intentionally not awaiting
  }
};

/*
 * See explanation of substituteMockWsServer under initialize() above.
 */
export const setupSocketServer = (socketServer: SocketServer) => {
  // Authentication callbacks
  socketServer.setAuthenticateUserCallback(authenticateSocketUser);
  socketServer.setUserDidFinishAuthenticatingCallback(socketUserFinishedAuthenticating);

  // Respond to meeting membership change
  socketServer.onChannelMemberChange(handleParticipantsChange);

  // Register endpoints
  socketServer.on('JoinMeeting', joinMeetingEndpoint);
  socketServer.on('LeaveMeeting', leaveMeetingEndpoint);
  socketServer.on('ChangeMeetingPhase', changeMeetingPhaseEndpoint);
  socketServer.on('CancelChangeMeetingPhase', cancelChangeMeetingPhaseEndpoint);
  socketServer.on('FetchAllNotes', fetchAllNotesEndpoint);
  socketServer.on('CreateNote', createNoteEndpoint);
  socketServer.on('PinNote', pinNoteEndpoint);
  socketServer.on('UpdateNote', updateNoteEndpoint);
  socketServer.on('DeleteNote', deleteNoteEndpoint);
  socketServer.on('CreateSummaryItem', createSummaryItemEndpoint);
  socketServer.on('DeleteSummaryItem', deleteSummaryItemEndpoint);
  socketServer.on('UpdateSummaryItem', updateSummaryItemEndpoint);
  socketServer.on('FetchAllSummaryItems', fetchAllSummaryItemsEndpoint);
  socketServer.on('FetchAllTopics', fetchAllTopicsEndpoint);
  socketServer.on('UpdateMeeting', updateMeetingEndpoint);
  socketServer.on('CreateTopic', createTopicEndpoint);
  socketServer.on('UpdateTopic', updateTopicEndpoint);
  socketServer.on('DeleteTopic', deleteTopicEndpoint);
  socketServer.on('SetCurrentTopic', setCurrentTopicForMeetingEndpoint);
  socketServer.on('FetchAllRelevantPeople', fetchAllRelevantPeopleEndpoint);
  socketServer.on('SendSummaryEmail', sendSummaryEmailEndpoint);
  socketServer.on('CopyPriorTopics', copyPriorTopicsEndpoint);
  socketServer.on('FetchPriorTopics', fetchPriorTopicsEndpoint);
  socketServer.on('FetchPriorMeetings', fetchPriorMeetingsEndpoint);
  socketServer.on('SendFeedback', sendFeedbackEndpoint);
  socketServer.on('FetchTaskList', fetchTasksForUserEndpoint);
  socketServer.on('FetchProtocolTypes', fetchProtocolTypesEndpoint);
  socketServer.on('FetchMeetingProtocols', fetchMeetingProtocolsEndpoint);
  socketServer.on('CreateProtocol', createProtocolEndpoint);
  socketServer.on('DeleteProtocol', deleteProtocolEndpoint);
  socketServer.on('NextProtocolPhase', nextProtocolPhaseEndpoint);
  socketServer.on('PreviousProtocolPhase', previousProtocolPhaseEndpoint);
  socketServer.on('CreateProtocolItem', createProtocolItemEndpoint);
  socketServer.on('CreateProtocolItemGroup', createProtocolItemGroupEndpoint);
  socketServer.on('UpdateProtocolItem', updateProtocolItemEndpoint);
  socketServer.on('UpdateProtocolItemGroup', updateProtocolItemGroupEndpoint);
  socketServer.on('UpdateMultipleProtocolItemsGroup', updateMultipleProtocolItemsGroupEndpoint);
  socketServer.on('PrioritizeProtocolItem', prioritizeProtocolItemEndpoint);
  socketServer.on('DeleteProtocolItem', deleteProtocolItemEndpoint);
  socketServer.on('EmitProtocolUserActivity', emitProtocolUserActivityEndpoint);
  socketServer.on('CreateProtocolItemAction', createProtocolItemActionEndpoint);
  socketServer.on('DeleteProtocolItemAction', deleteProtocolItemActionEndpoint);
  socketServer.on('EmitProtocolUserState', emitProtocolUserStateEndpoint);
  socketServer.on('ProtocolUserStateRequest', requestProtocolUserStateEndpoint);
  socketServer.on('FetchUserAddressBook', fetchUserAddressBookEndpoint);
  socketServer.on('SendInvites', sendInvitesEndpoint);
  socketServer.on('FetchNonUsersFromInviteeList', fetchNonUsersFromInviteeListEndpoint);
};
