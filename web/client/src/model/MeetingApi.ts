import * as Util from '../Utils';
import conn from '../SocketConnection';
import {
  AddressBookPerson,
  ChangeMeetingPhaseRequest,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  ExpressResponse,
  JoinMeetingRequest,
  MeetingPhase,
  MeetingWithTokenValue,
  SendFeedbackRequest,
} from 'miter-common/SharedTypes';
import {sendRequest} from '../HttpConnection';
import {validateAddressBookPeople, validateBulkMeetingResponse, validateMeetingTokenResponse} from './Validators';

export const createMeeting = async (title: string, phase?: MeetingPhase): Promise<string | null> => {
  const body: CreateMeetingRequest = {title, phase};
  try {
    const validResponse: ExpressResponse = await sendRequest('api/meeting', body, 'PUT');
    const token = validateMeetingTokenResponse(validResponse.body).tokenValue;
    return token;
  } catch (err) {
    Util.error(`Create meeting failed: ${err}`, true);

    return null;
  }
};

export const joinMeeting = (meetingExternalIdentifier: string) => {
  Util.log('Joining meeting.');
  const body: JoinMeetingRequest = {meetingExternalIdentifier};
  conn.request('JoinMeeting', body);
  conn.setReconnectListener(() => {
    conn.request('JoinMeeting', body);
  });
};

export const leaveMeeting = () => {
  conn.request('LeaveMeeting');
};

/*
 * Weird name is because in general we don't want to call this directly. Use the handle-action function in the context
 * provider instead, as it deals with latency compensation inside React.
 */
export const changeMeetingPhase_apiCallOnly = (newStatus: MeetingPhase, instant?: boolean) => {
  const body: ChangeMeetingPhaseRequest = {phase: newStatus, instant};
  conn.request('ChangeMeetingPhase', body);
};

export const cancelChangeMeetingPhase = () => {
  conn.request('CancelChangeMeetingPhase');
};

export const editMeetingGoal = (goal: string | null) => {
  const req: UpdateMeetingRequest = {goal};
  conn.request('UpdateMeeting', req);
};

export const editMeetingTitle = (title: string | null) => {
  const req: UpdateMeetingRequest = {title};
  conn.request('UpdateMeeting', req);
};

export const fetchPriorMeetings = async () => {
  const res = await conn.requestResponse('FetchPriorMeetings');
  return validateBulkMeetingResponse(res).meetings;
};

export const sendFeedback = async (email: string, feedback: string) => {
  const req: SendFeedbackRequest = {email, feedback};
  await conn.requestResponse('SendFeedback', req);
  Util.showToast(
    'Thanks for giving us your feedback! Your input is essential to our ability to improve the product.',
    'Feedback Sent'
  );
};

export const fetchMeetingList = async (callContext: string = 'timer'): Promise<MeetingWithTokenValue[]> => {
  const tzOffsetInSecs = new Date().getTimezoneOffset() * 60;
  const winAge = window.LoadTimestamp ? new Date().getTime() - window.LoadTimestamp : 0;
  const expressResponse = await sendRequest(
    `api/meetings-from-today?tzOffset=${tzOffsetInSecs}&callContext=${callContext}&clientVersion=${process.env.REACT_APP_VERSION}&winAge=${winAge}`,
    {},
    'GET'
  );
  const res = validateBulkMeetingResponse(expressResponse.body);
  return res.meetings;
};

export const fetchNonUsersFromInviteeList = async (): Promise<AddressBookPerson[]> => {
  const response = await conn.requestResponse('FetchNonUsersFromInviteeList');
  return validateAddressBookPeople(response);
};
