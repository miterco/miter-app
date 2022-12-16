import socket from '../SocketConnection';
import {
  CreateProtocolItemRequest,
  CreateProtocolRequest,
  EmitProtocolUserStateRequest,
  DeleteProtocolRequest,
  ProtocolPhaseChangeRequest,
  UpdateProtocolItemRequest,
  ProtocolItemActionType,
  DeleteProtocolItemActionRequest,
  CreateProtocolItemActionRequest,
  PrioritizeProtocolItemRequest,
  RequestProtocolUserStateRequest,
  DeleteProtocolItemRequest,
  CreateProtocolItemGroupRequest,
  UpdateProtocolItemGroupRequest,
  UpdateMultipleProtocolItemsGroupRequest,
  ProtocolItem,
} from 'miter-common/SharedTypes';
import {validateCreateProtocolItemGroupResponse} from './Validators';

//----------------------------------------------------------------------------------------------------------------------
//                                                   USER ACTIVITY
//----------------------------------------------------------------------------------------------------------------------
let lastActivityTime = Date.now();
export const sendActivityPing = () => {
  const now = Date.now();

  // Don't emit the user activity if it's been less than three seconds since the last one.
  if (now - lastActivityTime >= 3000) {
    socket.request('EmitProtocolUserActivity');
    lastActivityTime = now;
  }
};

export const sendSoloState = (isDone: boolean) => {
  socket.request<EmitProtocolUserStateRequest>('EmitProtocolUserState', {isDone});
};

export const requestProtocolUserState = (sessionId: string, protocolId?: string) => {
  if (!sessionId) throw new Error('Missing session id in requestProtocolUserState() call');
  if (!protocolId) throw new Error('Missing protocol id in requestProtocolUserState() call');

  socket.request<RequestProtocolUserStateRequest>('ProtocolUserStateRequest', {sessionId, protocolId});
};

//----------------------------------------------------------------------------------------------------------------------
//                                                  PROTOCOL TYPES
//----------------------------------------------------------------------------------------------------------------------
export const fetchProtocolTypes = async () => {
  // The only reason we are using `requestResponse` here is because we need to get a promise that notifies us when the
  // protocol types have been fetched. We need this in MeetingView to fetch the meeting protocols only after the
  // protocol types are available. Otherwise we would set the `currentProtocol` in ProtocolContextProvider and render
  // the ProtocolDrawer it would break because there are no protocol type data available.
  //
  // Ideally this would be fixed by having a way to perform socket endpoint requests that are not tied to a meeting
  // channel. E.g. protocol types and user profile info doesn't need a meeting to be retrieved.
  return socket.requestResponse('FetchProtocolTypes');
};

//----------------------------------------------------------------------------------------------------------------------
//                                                    PROTOCOLS
//----------------------------------------------------------------------------------------------------------------------
export const fetchMeetingProtocols = async () => {
  socket.request('FetchMeetingProtocols');
};

export const createProtocol = async (title: string, protocolTypeId: string, data: Record<string, any> = {}) => {
  socket.request<CreateProtocolRequest>('CreateProtocol', {title, protocolTypeId, data});
};

export const deleteProtocol = async (protocolId: string) => {
  socket.request<DeleteProtocolRequest>('DeleteProtocol', {protocolId});
};

//----------------------------------------------------------------------------------------------------------------------
//                                                    PHASES
//----------------------------------------------------------------------------------------------------------------------
export const moveToNextProtocolPhase = async (protocolId: string) => {
  socket.request<ProtocolPhaseChangeRequest>('NextProtocolPhase', {protocolId});
};

export const moveToPreviousProtocolPhase = async (protocolId: string) => {
  socket.request<ProtocolPhaseChangeRequest>('PreviousProtocolPhase', {protocolId});
};

//----------------------------------------------------------------------------------------------------------------------
//                                                PROTOCOL ITEMS
//----------------------------------------------------------------------------------------------------------------------
export const createProtocolItem = async (protocolId: string, text: string, parentId?: string) => {
  return socket.requestResponse<CreateProtocolItemRequest>('CreateProtocolItem', {protocolId, text, parentId});
};

export const createProtocolItemGroup = async (protocolId: string, text: string): Promise<ProtocolItem> => {
  const response = await socket.requestResponse<CreateProtocolItemGroupRequest>('CreateProtocolItemGroup', {
    protocolId,
    text,
  });
  return validateCreateProtocolItemGroupResponse(response as ProtocolItem);
};

export const updateProtocolItem = async (protocolItemId: string, text: string) => {
  return socket.requestResponse<UpdateProtocolItemRequest>('UpdateProtocolItem', {protocolItemId, text});
};

export const updateProtocolItemGroup = async (protocolItemId: string, parentId: string | null) => {
  return socket.requestResponse<UpdateProtocolItemGroupRequest>('UpdateProtocolItemGroup', {protocolItemId, parentId});
};

export const updateMultipleProtocolItemsGroup = async (protocolItemIds: string[], parentId: string | null) => {
  return socket.requestResponse<UpdateMultipleProtocolItemsGroupRequest>('UpdateMultipleProtocolItemsGroup', {
    protocolItemIds,
    parentId,
  });
};

export const prioritizeProtocolItem = async (protocolItemId: string, shouldPrioritize: boolean) => {
  socket.request<PrioritizeProtocolItemRequest>('PrioritizeProtocolItem', {protocolItemId, shouldPrioritize});
};

export const deleteProtocolItem = async (protocolItemId: string) => {
  socket.request<DeleteProtocolItemRequest>('DeleteProtocolItem', {protocolItemId});
};

//----------------------------------------------------------------------------------------------------------------------
//                                             PROTOCOL ITEM ACTIONS
//----------------------------------------------------------------------------------------------------------------------
export const createProtocolItemAction = async (protocolItemId: string, actionType: ProtocolItemActionType) => {
  await socket.requestResponse<CreateProtocolItemActionRequest>('CreateProtocolItemAction', {
    protocolItemId,
    actionType,
  });
};

export const deleteProtocolItemAction = async (protocolItemActionId: string) => {
  await socket.requestResponse<DeleteProtocolItemActionRequest>('DeleteProtocolItemAction', {protocolItemActionId});
};
