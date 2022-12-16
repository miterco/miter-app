import {
  EmailRecipient,
  Meeting,
  MeetingPhase,
  Note,
  ProtocolItem,
  ProtocolItemAction,
  SummaryItem,
} from 'miter-common/SharedTypes';
import {CalendarEventStatus} from '../data/meetings-events/create-bulk-calendar-events';
import {ProductSurface, SignUpService} from '@prisma/client';

// -------------------------------------------------------------------------------------------------
//                                           ORGANIZATIONS
// -------------------------------------------------------------------------------------------------

export interface Domain {
  id: string;
  name: string;
  organizationId?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  isLocked: Boolean;
  firstSignedUpUserId?: string | null;
  domain: Domain[];
  hubspotId?: string | null;
}

export interface UserGoogleIdentifiers {
  id: string;
  serviceId: string | null;
  tokens: Record<string, any> | null;
  gcalPushChannel?: string | null;
  gcalPushChannelExpiration?: Date | null;
  gcalResourceId?: string | null;
  gcalSyncToken?: string | null;
}

export interface UserZoomIdentifiers extends Omit<UserRecord, 'zoomTokens' | 'zoomUserId'> {
  zoomTokens?: Record<string, any>;
  zoomUserId?: string | null;
}

export type GoogleEventType = 'Single' | 'FirstInstance' | 'NthInstance';

export enum JobType {
  Automated = 'Automated',
  Manual = 'Manual',
}
export enum JobStatus {
  NotStarted = 'NotStarted',
  Completed = 'Completed',
  Failed = 'Failed',
  Canceled = 'Canceled',
}
export enum EmailJobName {
  SummaryEmail = 'Summary_Email',
  InviteEmail = 'InviteEmail',
  PasswordlessSignInEmail = 'PasswordlessSignInEmail',
}
export interface EmailJob {
  id: string;
  jobName: EmailJobName;
  jobStatus: JobStatus;
  jobType: JobType;
  jobRecipients: EmailRecipient[];
  sendAfter?: Date | null;
  meetingId?: string | null;
  creatorId?: string | null;
}

export type UnsavedAutomatedEmailJob = Omit<EmailJob, 'id' | 'jobStatus' | 'jobType'>;
export type UnsavedManualEmailJob = Omit<EmailJob, 'id' | 'jobType' | 'sendAfter'>;

export type MeetingIdentifierType = 'Google' | 'Token' | 'Other';

export interface FullCalendarEventRecord extends Omit<CalendarEvent, 'userId' | 'serviceId'> {
  serviceId: string | null;
  tokenValue?: string;
}

export interface CalendarEventWithAttendees extends FullCalendarEventRecord {
  attendees: Attendee[];
  recurringCalendarEventServiceId: string | null;
  googleEventType: GoogleEventType;
  status: CalendarEventStatus;
  phase?: MeetingPhase;
}

export interface UnsavedCalendarEventWithAttendees extends Omit<CalendarEventWithAttendees, 'meetingId' | 'id'> {
  meetingId?: never;
  id?: never;
  recurrenceRule: string | null;
}

export interface FullPersonRecord {
  id: string;
  organizationId?: string | null;
  serviceId?: string | null;
  displayName?: string | null;
  picture?: string | null;
  lastInvitedDate?: Date | null;
}

export interface FullPersonWithEmail extends FullPersonRecord {
  email: string;
  emailAddressId: string;
  domainId?: string | null;
}

export interface Attendee extends FullPersonWithEmail {
  optional: boolean;
  responseStatus: string;
}

export interface UserRecord {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  loginEmail: string;
  picture?: string | null;
  personId: string;
  signUpService: SignUpService;
  signUpProductSurface: ProductSurface;
  installedChromeExtension?: boolean; // Marking as optional so we don't have to pass it at creation time and such
  wipFeature?: string | null;

  // Google fields.
  serviceId: string | null; // Google User ID.
  gcalPushChannel?: undefined;
  gcalPushChannelExpiration?: undefined;
  gcalResourceId?: undefined;
  gcalSyncToken?: undefined;
  tokens?: undefined;

  // Zoom fields.
  zoomTokens?: undefined;
  zoomUserId: string | null;

  // Org Locking
  organizationId?: string | null;
}

export const standardUserFieldsForPrisma = {
  id: true,
  serviceId: true, // Google User ID.
  zoomUserId: true,
  displayName: true,
  firstName: true,
  lastName: true,
  loginEmail: true,
  picture: true,
  personId: true,
  signUpService: true,
  signUpProductSurface: true,
  installedChromeExtension: true,
  wipFeature: true,
  organizationId: true,
};

export interface RecurringCalendarEvent {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface CalendarEvent {
  id: string;
  meetingId: string;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  userId?: never;
  serviceId?: never;
  token?: never;
}

export interface MeetingWithToken {
  meeting: Meeting;
  token: string | null;
}

export interface MeetingWithContentFlags {
  meeting: Meeting;
  hasTopics?: boolean;
  hasNotes?: boolean;
  hasSummaryItems?: boolean;
}

export interface NoteRecord extends Omit<Note, 'meetingId'> {
  meetingId: string;
}

export interface SummaryItemRecord extends Omit<SummaryItem, 'meetingId' | 'systemMessageType'> {
  meetingId: string | null;
  systemMessageType?: string;
}

export interface ItemAssociatedPersonRecord {
  personId: string;
  personEmailId: string | null;
  noteId: string | null;
  summaryItemId: string | null;
}

export interface ZoomAPICredentials {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expiration?: number;
}

export interface ZoomAPIConfig {
  credentials?: ZoomAPICredentials;
  authCode?: string;
  userId?: string;
}

export interface HubspotContact {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface UnsavedHubspotContact extends Omit<HubspotContact, 'id' | 'createdAt' | 'updatedAt'> {
  google_is_active: boolean;
  zoom_is_active: boolean;
}

export interface UnsavedProtocolItem
  extends Required<Pick<ProtocolItem, 'creatorId' | 'protocolId' | 'protocolPhaseId' | 'text' | 'type' | 'parentId'>> {
  tags?: string[];
  data?: Record<string, any>;
}

export type UnsavedProtocolItemGroup = Omit<UnsavedProtocolItem, 'parentId'>;

export interface UnsavedProtocolItemAction extends Required<Omit<ProtocolItemAction, 'id' | 'createdAt' | 'data'>> {
  data?: Record<string, any>;
}
