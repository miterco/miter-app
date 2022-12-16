import {
  ChangeMeetingPhaseRequest,
  MeetingPhase,
  MeetingPhaseValues,
  MeetingResponse,
  PendingMeetingPhaseChangeResponse,
  ValidationError,
} from 'miter-common/SharedTypes';
import {fetchAllTopicsForMeeting} from '../../data/topics/fetch-all-topics';
import {setCurrentTopicForMeeting} from '../../data/topics/set-current-topic-for-meeting';
import {Endpoint, SocketServer} from '../../server-core/socket-server';
import {validateSocketRequestBody} from '../endpoint-utils';
import {changeMeetingPhase} from '../../logic/change-meeting-phase';

const PhaseChangeTimeoutDuration = 2500; // ms
const PhaseChangeTimerKey = 'PhaseChangeTimer';

const validateChangeMeetingPhaseRequest = (body: any): ChangeMeetingPhaseRequest => {
  const neBody = validateSocketRequestBody(body);
  if (typeof neBody.phase !== 'string') {
    throw new ValidationError(`Change-phase request expected a string, got ${typeof neBody.phase}.`);
  }
  if (!MeetingPhaseValues.includes(neBody.phase)) {
    throw new ValidationError(`Change-phase request expects a phase value, got ${neBody.phase}.`);
  }
  if (neBody.instant !== undefined && typeof neBody.instant !== 'boolean') {
    throw new ValidationError(
      `Change-phase request got a non-boolean value for instant, of type ${typeof neBody.instant}.`
    );
  }
  return neBody;
};

export const clearPhaseTimerForMeeting = (server: SocketServer, meetingId: string) => {
  const existingTimer = server.getInfoForChannel(meetingId, PhaseChangeTimerKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
    server.setInfoForChannel(meetingId, PhaseChangeTimerKey, null);
  }
};

export const executePhaseChange = async (server: SocketServer, meetingId: string, phase: MeetingPhase) => {
  clearPhaseTimerForMeeting(server, meetingId);
  const meeting = await changeMeetingPhase(meetingId, phase);

  // TODO This next bit should ultimately move to the central changeMeetingPhase() function so that if we expand the
  // concept of a "stale" or empty meeting to include those that have tabs stil open, those tabs get updated. I'm
  // punting on that for now because it requires a little rejiggering of socket server to be more of a singleton, which
  // isn't hard but then there's a cascade effect where we want to remove it as an arg on a bunch of functions.
  const res: MeetingResponse = {meeting};
  server.broadcast(meetingId, 'Meeting', res);

  // TODO This could move to the central function too, but doesn't need to. If we do move it, we should narrow its
  // scope: once a meeting has started I don't think there's much need for it?
  if (!meeting.currentTopicId) {
    const topics = await fetchAllTopicsForMeeting(meeting.id);
    if (topics && topics.length) {
      const updatedMeeting = await setCurrentTopicForMeeting(meeting, topics[0].id);
      if (!updatedMeeting) throw new Error(`Failed to set current topic for meeting ${meeting.id}`);
      const res: MeetingResponse = {meeting: updatedMeeting};
      server.broadcast(meetingId, 'Meeting', res);
    }
  }
};

export const changeMeetingPhaseEndpoint: Endpoint = async (server, client, body) => {
  const {phase, instant} = validateChangeMeetingPhaseRequest(body);
  const meetingId = server.getExistingChannel(client);

  // Clear any preexisting phase-change timer. They shouldn't exist but just in case.
  clearPhaseTimerForMeeting(server, meetingId);

  // Let clients know about the timer
  const duration = instant ? 0 : PhaseChangeTimeoutDuration;
  const response: PendingMeetingPhaseChangeResponse = {phase, changeTime: Date.now() + duration};
  server.broadcast(meetingId, 'MeetingPhaseChangePending', response);

  // Set a phase-change timer
  const timer = setTimeout(() => executePhaseChange(server, meetingId, phase), duration);
  server.setInfoForChannel(meetingId, PhaseChangeTimerKey, timer);
};

export const cancelChangeMeetingPhaseEndpoint: Endpoint = async (server, client) => {
  const meetingId = server.getExistingChannel(client);
  clearPhaseTimerForMeeting(server, meetingId);

  // Send a response regardless of whether there was an actual pending change to cancel. In the case of a race condition,
  // better to have an extraneous cancel message than a client stuck in a pending state (though neither should actually
  // happen).
  server.broadcast(meetingId, 'MeetingPhaseChangeCanceled', null);
};
