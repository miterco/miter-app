type RequireAtLeastOne<T> = {[K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>}[keyof T];

export enum ProductSurface {
  WebApp = 'WebApp',
  ChromeExtension = 'ChromeExtension',
  ZoomApp = 'ZoomApp',
  Unknown = 'Unknown',
}

// -------------------------------------------------------------------------------------------------
//                               SOCKET & EXPRESS REQUESTS & FORMATS
// -------------------------------------------------------------------------------------------------

export type SocketRequestType =
  | 'FetchUserAddressBook'
  | 'JoinMeeting'
  | 'LeaveMeeting'
  | 'ChangeMeetingPhase'
  | 'CancelChangeMeetingPhase'
  | 'FetchPriorMeetings'
  | 'CreateNote'
  | 'PinNote'
  | 'UpdateNote'
  | 'DeleteNote'
  | 'FetchAllSummaryItems'
  | 'CreateSummaryItem'
  | 'DeleteSummaryItem'
  | 'UpdateSummaryItem'
  | 'KeepAlive'
  | 'Authenticate'
  | 'FetchAllNotes'
  | 'FetchMeeting'
  | 'UpdateMeeting'
  | 'FetchAllTopics'
  | 'CreateTopic'
  | 'UpdateTopic'
  | 'CopyPriorTopics'
  | 'FetchPriorTopics'
  | 'DeleteTopic'
  | 'FetchAllRelevantPeople'
  | 'SendSummaryEmail'
  | 'SendFeedback'
  | 'SetCurrentTopic'
  | 'FetchTaskList'
  | 'FetchProtocolTypes'
  | 'CreateProtocol'
  | 'DeleteProtocol'
  | 'NextProtocolPhase'
  | 'UpdateProtocolItem'
  | 'UpdateProtocolItemGroup'
  | 'UpdateMultipleProtocolItemsGroup'
  | 'PrioritizeProtocolItem'
  | 'DeleteProtocolItem'
  | 'EmitProtocolUserActivity'
  | 'CreateProtocolItem'
  | 'CreateProtocolItemGroup'
  | 'PreviousProtocolPhase'
  | 'FetchMeetingProtocols'
  | 'CreateProtocolItemAction'
  | 'DeleteProtocolItemAction'
  | 'ProtocolUserStateRequest'
  | 'EmitProtocolUserState'
  | 'SendInvites'
  | 'FetchNonUsersFromInviteeList';

export type SocketResponseType =
  | 'UserAddressBook'
  | 'Meeting'
  | 'MeetingToken'
  | 'MeetingPhaseChangePending'
  | 'MeetingPhaseChangeCanceled'
  | 'LeftMeeting'
  | 'UpdatedNotes'
  | 'AllNotes'
  | 'UpdatedSummaryItems'
  | 'AllTopics'
  | 'AllSummaryItems'
  | 'ParticipantsChanged'
  | 'AllAttendees'
  | 'CurrentUser'
  | 'AllRelevantPeople'
  | 'DirectResponse'
  | 'Error'
  | 'AllMeetingProtocols'
  | 'AllProtocolTypes'
  | 'Protocol'
  | 'ProtocolItem'
  | 'ProtocolUserActivity'
  | 'ProtocolUserStateRequest'
  | 'ProtocolUserState'
  | 'InvitesSent';

export type SystemMessageType = 'CurrentTopicSet' | 'Protocol' | 'StandardNote';

export type SocketRequestBody = Record<string, any> | null;
export type ExpressRequestBody = Record<string, any>;
export type ResponseBody = Record<string, any> | null;
export type SocketRequestMessage = {requestType: SocketRequestType; requestId?: string; body: SocketRequestBody};
export type SocketResponseMessage = {responseType: SocketResponseType; requestId?: string; body: ResponseBody};

export interface ExpressResponse<T = ResponseBody> {
  success: boolean;
  error?: string;
  body?: T;
}

export interface ErrorResponse {
  description: string;
}

// -------------------------------------------------------------------------------------------------
//                                             PEOPLE
// -------------------------------------------------------------------------------------------------

export interface Person {
  id?: string | null;
  userId?: string | null;
  displayName?: string;
  initials?: string;
  picture?: string | null;
  email?: string;
  lastInvitedDate?: Date | null;
}
export const DefaultPersonData: Person = {
  displayName: 'Unknown Person',
  initials: '?',
};

// Note use of name key rather than, say, displayName because it matches what
// SendGrid expects and it seemed silly to have two otherwise-identical types.
export interface EmailRecipient {
  name?: string;
  email: string;
}

export interface EmailRecipientWithId extends Omit<Person, 'id'> {
  name?: string;
  email: string;
  id: string;
}

export interface AddressBookPerson extends EmailRecipient {
  picture?: string | null;
  eventCount: number;
}

/*
 * Shared concept of a signed-in user.
 */
export interface User extends Required<Omit<Person, 'id' | 'lastInvitedDate'>> {
  wipFeature?: string | null;
}

export type GuestUser = {};
export type UserOrGuest = User | GuestUser;

// -------------------------------------------------------------------------------------------------
//                                           MEETINGS
// -------------------------------------------------------------------------------------------------

export type MeetingPhase = 'NotStarted' | 'InProgress' | 'Ended';
export const MeetingPhaseValues: MeetingPhase[] = ['NotStarted', 'InProgress', 'Ended']; // Validation
export interface Meeting {
  id: string;
  organizationId: string | null;
  currentTopicId?: string | null;
  currentProtocolId?: string | null;
  meetingSeriesId?: string | null;
  isTemplate: false;
  isSampleMeeting?: boolean;
  isFirstMeetingInSeries?: boolean; // More of a "Base Instance" for now but will be combining meeting instances at some point in the near future that it truly is the first again
  title: string | null;
  isGoalExempt: boolean; // Intentional mismatch with DB--by the time we hit the client, we don't want null here
  goal: string | null; // JSON-encoded Goal struct but we're keeping that out at the edges for now
  phase: MeetingPhase;
  allDay: boolean;
  startDatetime: Date | null;
  endDatetime: Date | null;
  createdDate?: Date | null;
  zoomMeetingId: string | null;
  zoomNumericMeetingId: string | null;
}

export interface Template extends Omit<Meeting, 'isTemplate'> {
  isTemplate: true;
}

// Title is only null if you initially create a "No Title" recurring event in GCal. We will want to allow this to be
// overwritten with a real value so won't feed in something like ""
export interface MeetingSeries {
  id: string;
  title: string | null;
}

export interface MeetingWithTokenValue extends Omit<Meeting, 'id'> {
  tokenValue: string;
}

export interface MeetingToken {
  id: string;
  meetingId: string;
  value: string;
  expirationDate: Date;
}

export interface Topic {
  id: string;
  meetingId: string;
  createdBy?: string | null;
  text: string;
  order: number;
}

// -------------------------------------------------------------------------------------------------
//                                            NOTES
// -------------------------------------------------------------------------------------------------

export interface Note {
  id: string;
  meetingId?: never;
  topicId?: string | null;
  createdBy: string | null;
  ownerId: string | null;
  protocolId?: string | null;
  itemText: string;
  systemMessageType: SystemMessageType;
  timestamp: Date | null;
  itemType: ItemType;
  targetDate: Date | null;
}

export interface UnsavedNote {
  id?: never;
  itemText: string;
  meetingId?: never;
  timestamp?: never;
  createdBy?: never;
  itemType?: ItemType;
  targetDate: Date | null;
}

// -------------------------------------------------------------------------------------------------
//                                       SUMMARY ITEMS
// -------------------------------------------------------------------------------------------------

export interface SummaryItem {
  id: string;
  meetingId: string | null;
  createdBy: string | null;
  noteId?: string | null;
  topicId?: string | null;
  itemType: ItemType | null;
  itemText?: string | null;
  itemText2?: string | null;
  taskProgress?: TaskProgressType;
  itemOwnerId?: string | null;
  targetDate: Date | null;
  protocolId?: string | null;
  protocol?: Protocol;
  systemMessageType: SystemMessageType;
}

export interface SummaryItemWithContext {
  summaryItem: SummaryItem;
  meeting: MeetingWithTokenValue | null;
  topic: Topic | null;
  owner?: Person;
}

export interface UnsavedSummaryItem
  extends Omit<SummaryItem, 'id' | 'meetingId' | 'timestamp' | 'createdBy' | 'systemMessageType'> {
  id?: never;
  meetingId?: never;
  timestamp?: never;
  createdBy?: never;
  systemMessageType?: never;
}

export const ItemTypeValues = ['None', 'Pin', 'Decision', 'Task'] as const;
export const TaskProgressValues = ['None', 'Completed'] as const;
export type ItemType = typeof ItemTypeValues[number];
export type TaskProgressType = typeof TaskProgressValues[number];
export interface GoalTypeInfo {
  goalType: GoalType;
  string: string;
  group: GoalTypeGroup;
  isDisabled?: boolean; // Yeah, it's a negative boolean. Less mistake-prone this way.
}

// -------------------------------------------------------------------------------------------------
//                                           GOALS
// -------------------------------------------------------------------------------------------------

export const GoalTypeValues = [
  'MakePlan',
  'MakeChoice',
  'CreateCollab',
  'ReviewWork',
  'ShareInfo',
  'BuildRelationships',
  'CareerFeedback',
  'Other',
  'ReviewProcess',
] as const;
export type GoalType = typeof GoalTypeValues[number];
export const GoalTypeMap: Record<GoalType, Omit<GoalTypeInfo, 'goalType'>> = {
  MakePlan: {string: 'Create a plan', group: 'Main'},
  MakeChoice: {string: 'Make a decision', group: 'Main'},
  CreateCollab: {string: 'Problem-solve or brainstorm', group: 'Main'},
  ReviewWork: {string: 'Review work for feedback', group: 'Main'},
  ShareInfo: {string: 'Present information or update', group: 'Main'},
  BuildRelationships: {string: 'Team-building', group: 'Main'},
  CareerFeedback: {string: 'Career development', group: 'Main'},
  Other: {string: 'Other', group: 'Other'},

  ReviewProcess: {string: 'Process review (retrospective, etc.)', group: 'Main', isDisabled: true},
};
export type GoalTypeGroup = 'Main' | 'Other';

export interface Goal {
  type: GoalType;
  customText?: string;
}

// -------------------------------------------------------------------------------------------------
//                                           PROTOCOLS
// -------------------------------------------------------------------------------------------------
export enum ProtocolPhaseType {
  SingleResponse = 'SingleResponse',
  MultipleResponses = 'MultipleResponses',
  SoloMultipleResponses = 'SoloMultipleResponses',
  ContentList = 'ContentList',
  UserContentList = 'UserContentList',
  VoteOnContentList = 'VoteOnContentList',
  ReviewVoteResults = 'ReviewVoteResults',
  OrganizeContentList = 'OrganizeContentList',
}

export interface ProtocolPhase {
  id: string;
  protocolTypeId: string;
  name: string;
  description: string;
  index: number;
  type: ProtocolPhaseType;
  isCollective: boolean;
  data: Record<string, any>;
}

export interface ProtocolType {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>;
  phases: ProtocolPhase[];
}

export enum ProtocolItemType {
  Item = 'Item',
  Group = 'Group',
}

export interface ProtocolItem {
  id: string;
  creatorId: string;
  protocolId: string;
  protocolPhaseId: string;
  text: string;
  tags: string[];
  data: Record<string, any>;
  createdAt: Date;
  isForcefullyPrioritized?: boolean;
  isForcefullyDeprioritized?: boolean;
  type: ProtocolItemType;
  parentId: string | null;

  creator?: User;
  actions?: ProtocolItemAction[];
  parent?: ProtocolItem;
  children?: ProtocolItem[];
}

export enum ProtocolItemActionType {
  Vote = 'Vote',
}

export interface ProtocolItemAction {
  id: string;
  creatorId: string;
  protocolItemId: string;
  protocolId: string;
  type: string;
  data: Record<string, any>;
  createdAt: Date;
}

export interface Protocol {
  // IDs.
  id: string;
  typeId: string;
  creatorId: string | null;
  currentPhaseIndex: number;

  // Protocol data.
  title: string;
  isCompleted: boolean;
  readyForNextPhase: boolean;
  data: Record<string, any>;
  lastPhaseChangeDate: Date | null;

  // Metadata.
  createdAt?: Date;

  // Relations.
  creator?: User;
  currentPhase: ProtocolPhase;
  type: ProtocolType;

  items: ProtocolItem[];
  phases: ProtocolPhase[];
}

// -------------------------------------------------------------------------------------------------
//                                     REQUEST/RESPONSE: AUTH
// -------------------------------------------------------------------------------------------------

// TODO maybe get rid of most or all of this and just use HTTP status codes
export type SignInResponse = {error: string} | {isNewUser: boolean; userId: string; loginEmail: string};

export interface AuthRequest {
  miterUserId: string;
}

export interface AuthCheckResponse {
  isAuthenticated: boolean;
  userId?: string;
  loginEmail?: string;
}

// -------------------------------------------------------------------------------------------------
//                                   REQUEST/RESPONSE: MEETINGS
// -------------------------------------------------------------------------------------------------

export type MeetingTimeResponseBody = {
  startDate: Date | null;
  endDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  isScheduledAroundNow?: boolean;
  phase: MeetingPhase;

  // Omitting for safety
  id?: undefined;
  title?: undefined;
  goal?: undefined;
  description?: undefined;
  userId?: undefined;
  serviceId?: undefined;
};

// Request / response types: Auth ---------

export interface LinkedServicesResponse {
  Google: boolean;
  GoogleCalendar: boolean;
  Zoom: boolean;
  ChromeExtension: boolean;
}

export interface MagicLinkResponse {
  url: string;
}

export interface PasswordlessSignUpRequest {
  email: string;
  firstName: string;
  lastName: string;
}
export interface CreateMeetingRequest {
  title: string;
  goal?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  phase?: MeetingPhase;
}

export interface JoinMeetingRequest {
  meetingExternalIdentifier: string;
}

export interface ChangeMeetingPhaseRequest {
  phase: MeetingPhase;
  instant?: boolean;
}

export interface PendingMeetingPhaseChangeResponse {
  phase: MeetingPhase;
  changeTime: number; // Unix timestamp of when the change will occur
}

export interface FetchCalendarEventPeopleRequest {
  calendarEventId: string;
}

export interface MeetingTokenResponseBody {
  tokenValue: string;
}

export interface MeetingResponse {
  meeting: Meeting | null;
  error?: string;
  errorCode?: ErrorCode;
}

export interface BulkMeetingResponse {
  meetings: MeetingWithTokenValue[];
}

export interface UpdateMeetingRequest {
  title?: string | null;
  goal?: string | null;
  phase?: MeetingPhase;
}

/*
 * callContext, clientVersion, and winAge are here as of Feb 2022 to debug the mass of unexpected calls to this
 * endpoint. They (and associated args in loadMeetingList() etc) should be removed once that's sorted.
 */
export interface MeetingsFromTodayRequest {
  startOffset?: number;
  endOffset?: number;
  callContext?: string;
  clientVersion?: string;
  winAge?: number;
}

// -------------------------------------------------------------------------------------------------
//                                       REQUEST/RESPONSE: TOPICS
// -------------------------------------------------------------------------------------------------

export interface TopicsResponse {
  topics: Topic[];
}

export interface CreateTopicRequest {
  text: string;
  order?: number;
}

export interface UpdateTopicRequest {
  id: string;
  text?: string;
  order?: number;
}

export interface DeleteTopicRequest {
  id: string;
}

export interface SetCurrentTopicForMeetingRequest {
  topicId: string | null;
}

// -------------------------------------------------------------------------------------------------
//                                    REQUEST/RESPONSE: NOTES
// -------------------------------------------------------------------------------------------------

export interface FetchNoteRequest {
  id: string;
}

export interface CreateNoteRequest {
  note: UnsavedNote;
}

export interface UpdateNoteRequest {
  id: string;
  itemText?: string;
  targetDate?: Date;
  topicId?: string | null;
}

export interface DeleteNoteRequest {
  id: string;
}

export interface AllNotesResponse {
  notes: Note[];
}
export interface UpdatedNotesResponse {
  created?: Note[];
  changed?: Note[];
  deleted?: {id: string}[];
}

export interface PinNoteRequest {
  id: string;
  itemType: ItemType;
}

// -------------------------------------------------------------------------------------------------
//                                  REQUEST/RESPONSE: SUMMARY ITEMS
// -------------------------------------------------------------------------------------------------

export interface SendSummaryEmailRequest {
  recipients: EmailRecipient[];
}
export interface CreateSummaryItemRequest {
  summaryItem: UnsavedSummaryItem;
  outsideOfMeeting?: boolean;
}

export interface SummaryItemsResponse {
  summaryItems: SummaryItem[];
}

export interface UpdatedSummaryItemsResponse {
  changed?: SummaryItem[];
  created?: SummaryItem[];
  deleted?: {id: string}[];
}

export interface SummaryItemsWithContextResponse {
  summaryItems: SummaryItemWithContext[];
}

export interface UpdateSummaryItemRequest {
  id: string;
  itemType?: ItemType;
  itemText?: string;
  itemText2?: string;
  targetDate?: Date | null;
  topicId?: string | null;
  taskProgress?: TaskProgressType;
}

export interface DeleteSummaryItemRequest {
  id: string;
}

export const TaskListFilterValues = ['MyTasks', 'MyMeetings'] as const;
export type TaskListFilter = typeof TaskListFilterValues[number];
export interface FetchTaskListRequest {
  filter: TaskListFilter;
  showCompleted?: boolean;
}

export interface FetchTasksByMeetingSeriesRequest {
  meetingSeriesId: string;
  includeOnlyUserTasks: boolean;
}

// -------------------------------------------------------------------------------------------------
//                                 REQUEST/RESPONSE: USERS & PEOPLE
// -------------------------------------------------------------------------------------------------

export interface PeopleResponse {
  people: Person[];
}

export interface RelevantPeopleResponse {
  people: EmailRecipientWithId[];
}

export interface FetchUserAddressBookRequest {
  limit?: number;
}

export interface UserAddressBookResponse {
  people: AddressBookPerson[];
}

export interface SendInvitesRequest {
  recipients: EmailRecipient[];
}

export interface InvitesSentResponse {
  succeeded: EmailRecipient[];
  failed: EmailRecipient[];
}

// -------------------------------------------------------------------------------------------------
//                                       REQUEST/RESPONSE: PROTOCOLS
// -------------------------------------------------------------------------------------------------

export interface CreateProtocolRequest {
  title: string;
  protocolTypeId: string;
  data: Record<string, any>;
}

export interface DeleteProtocolRequest {
  protocolId: string;
}

export interface CreateProtocolItemRequest {
  text: string;
  protocolId: string;
  parentId?: string;
}

export interface CreateProtocolItemGroupRequest {
  text: string;
  protocolId: string;
}

export interface CreateProtocolItemResponse {
  item: ProtocolItem;
}

export interface CreateProtocolItemActionRequest {
  protocolItemId: string;
  actionType: string;
}

export interface DeleteProtocolItemActionRequest {
  protocolItemActionId: string;
}

export interface UpdateProtocolItemRequest {
  protocolItemId: string;
  text: string;
}

export interface UpdateProtocolItemGroupRequest {
  protocolItemId: string;
  parentId: string | null;
}

export interface UpdateMultipleProtocolItemsGroupRequest {
  protocolItemIds: string[];
  parentId: string | null;
}

export interface PrioritizeProtocolItemRequest {
  protocolItemId: string;
  shouldPrioritize: boolean;
}

export interface DeleteProtocolItemRequest {
  protocolItemId: string;
}

export interface ProtocolPhaseChangeRequest {
  protocolId: string;
}

export interface EmitProtocolUserStateRequest {
  isDone: boolean;
}

export interface RequestProtocolUserStateRequest {
  sessionId: string;
  protocolId: string;
}

export interface ProtocolUserState {
  userId: string;
  isDone: boolean;
}

// -------------------------------------------------------------------------------------------------
//                                       REQUEST/RESPONSE: MISC
// -------------------------------------------------------------------------------------------------

export interface SendFeedbackRequest {
  email: string;
  feedback: string;
}

// Errors
// -------------------------------------------------------------------------------------------------
//                                               ERRORS
// -------------------------------------------------------------------------------------------------

export enum ErrorCode {
  Unknown = 0,
  NotAuthenticated = 100,
  NotFound = 101,
  ValidationError = 400,
}

export class MiterError extends Error {
  statusCode: ErrorCode;

  constructor(message: string, statusCode?: ErrorCode) {
    super(message);
    Object.setPrototypeOf(this, MiterError.prototype);
    this.statusCode = statusCode || ErrorCode.Unknown;
  }
}
export class ValidationError extends MiterError {
  constructor(message: string) {
    super(message, ErrorCode.ValidationError);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
