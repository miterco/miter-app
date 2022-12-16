/*
 * A place to centralize strings for localization and whatnot.
 */

import {ItemType} from './SharedTypes';

export const ItemTypeLabels: Record<ItemType, {Singular: string; Plural: string}> = {
  None: {Singular: 'None', Plural: 'None'},
  Task: {Singular: 'Action Item', Plural: 'Action Items'},
  Decision: {Singular: 'Decision', Plural: 'Decisions'},
  Pin: {Singular: 'Starred Note', Plural: 'Starred Notes'},
};

export const DefaultGoalStringPastTense = 'Meeting had no goal';

export const SummaryListEmpties: Record<ItemType, string> = {
  Decision: 'No decisions recorded.',
  Pin: 'No notes starred.',
  Task: 'No action items.',
  None: '',
};

export const StrMeetingCommands = {
  Start: 'Start Meeting',
  End: 'Summarize',
  SendSummary: 'Send Summary',
  Invite: 'Invite',
};

export const StrPhaseChangeDescriptions: Record<string, string> = {
  NotStarted_InProgress: 'Starting meeting...',
  InProgress_NotStarted: 'Un-starting meeting...',
  InProgress_Ended: 'Finishing and moving to summary...',
  Ended_InProgress: 'Going back from summary to meeting...',
  unknown: 'Changing meeting phase...',
};

export const StrProtocols = {
  Protocol: 'Dynamic',
  Protocols: 'Dynamics',
  ProtocolsTooltip: 'Start a structured conversation to better meet your goal.',
  ProtocolsSignInPrompt: {
    Title: 'Sign in for Dynamics',
    Body: 'Dynamics require that we know who you are. Please take a moment to sign into Miter before using them.',
  },
  AddProtocolHeader: 'Add a Dynamic',
  AddProtocolDescription: 'Use a dynamic to structure your conversation in real time. Facilitate like a pro!',
  IntroModalDescription:
    'Welcome to Miter Dynamics! Use Dynamics to facilitate a structured conversation and drive it toward its goal.',
};

export const StrInviteColleagues: Record<string, string> = {
  InviteColleaguesDescription:
    'Take a moment to invite the people in your upcoming meetings — Miter works best when you use it as a team!',
  InviteColleaguesCTADescription:
    'Miter works best when you use it as a team! Invite the people you meet with so you can meet better, together.',
  EmptyColleaguesList: 'No colleagues found in need of Miter invites. Congratulations!',
  InviteMeetingColleaguesDescription:
    'Miter works best when you use it as a team! Take a moment to invite colleagues in this meeting who aren’t on Miter yet:',
  EmptyMeetingColleaguesList: 'Everyone on the calendar event is already a Miter user. Nice!',
  CopyLinkTooltip: 'Copy a link to your clipboard that anyone can use to join this meeting.',
};

export const Shutdown: Record<string, string> = {
  LongTitle: 'Miter will be shutting down on December 14',
  ShortTitle: 'Miter Shutting Down',
  Description:
    'After noon PST on Dec 14, 2022, our apps will no longer be available. To preserve a meeting summary, use the Send Summary button on the summary screen.',
  ChromeInstructions:
    'Miter for Chrome will stop working; we recommend you uninstall it to avoid future complications.',
  ActionLabel: 'Learn More',
  ActionUrl: 'https://miter.co',
};
