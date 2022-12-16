/*
 * Handles connections to our data store(s).
 * TODO: Should shift some of the manual-querying onto an ORM library
 * or maybe a GraphQL thing.
 *
 * Note that (a) we aren't using the database as much as we need to yet,
 * and (b) some data stuff is happening in Redis and may not stay there.
 */

import {
  Prisma,
  meeting,
  note,
  person,
  protocol,
  protocolPhase,
  protocolType,
  protocolItem,
  protocolItemAction,
  ProtocolItemType as PrismaProtocolItemType,
  user,
} from '@prisma/client';
import {
  Meeting,
  MeetingPhase,
  Note,
  Template,
  User,
  Protocol,
  ProtocolType,
  ProtocolPhase,
  ProtocolPhaseType,
  ProtocolItem,
  ProtocolItemAction,
  ProtocolItemType,
  ValidationError,
} from 'miter-common/SharedTypes';
import {updateMeeting} from './meetings-events/update-meeting';
import {UserRecord} from '../server-core/server-types';
import {getDisplayNameForUserRec, getInitialsForUserRec} from '../server-core/server-util';

/*
 * If a meeting title begins with one of these strings, we exempt it from goal nudges. I'm limiting this to string
 * matches for now because it covers the cases I'm aware of, and because a (cursory) examination suggests a regex match
 * like 20x slower than a string match. I'm also doing some rudimentary caching that could be improved upon in a variety
 * of ways but this was easy.
 *
 * The list is typed as an array of tuples:
 * [<the string to match on>,
 *  <type of search - starts is default>,
 *  <flag: search case-sensitive?>]
 *
 */
type SearchType = 'starts' | 'ends' | 'anywhere' | 'entire';
const GoalExemptSubjects: [string, SearchType, boolean /* case-sensitive */][] = [
  // Calendar Holds
  ['hold', 'starts', false],
  ['[hold', 'starts', false],

  // Calendar Blocks
  ['Busy ', 'starts', true],
  ['DNS', 'anywhere', true],
  ['do not schedule', 'anywhere', false],
  ['ooo', 'anywhere', false],
  ['out of office', 'anywhere', false],
  ['block:', 'starts', false],
  ['blocking', 'starts', false],
  [' block ', 'anywhere', false],
  [' block', 'ends', false],
  ['no meeting', 'starts', false],

  // Focus and relax
  ['focus', 'anywhere', false],
  ['meditat', 'anywhere', false],
  ['Decompress', 'anywhere', true],

  // Logistical
  ['Canceled', 'starts', false],

  // Outside Activities
  ['Flight to', 'starts', false],
  ['Your Itinerary', 'starts', false],
  ['dentist', 'anywhere', false],
  ['doctor', 'entire', false],
  ['gym', 'entire', false],
  ['yoga', 'anywhere', false],
  ['take a walk', 'anywhere', false],
  ['personal commitment', 'anywhere', false],
  ['HIIT', 'anywhere', true],

  // Non-meeting meetings
  ['lunch', 'anywhere', false],
  ['dinner', 'anywhere', false],
  ['supper', 'anywhere', false],
];

export type PersonWithEmails = Prisma.personGetPayload<{
  include: {emailAddress: true};
}>;

export type MeetingWithItems = Prisma.meetingGetPayload<{
  include: {summaryItem: true};
}> | null;

export const OneHour = 60 * 60 * 1000;

/*
 * Given a meeting title, return a boolean indicating if the meeting is exempt from goal nudges.
 */
export const calculateIsGoalExempt = (title: string | null) => {
  if (!title) return false;
  for (let i = 0; i < GoalExemptSubjects.length; i++) {
    const [matchStrRaw, searchType, isCaseSensitive] = GoalExemptSubjects[i];
    const matchStr = isCaseSensitive ? matchStrRaw : matchStrRaw.toLowerCase();
    const sourceStr = isCaseSensitive ? title : title.toLowerCase();
    switch (searchType) {
      case 'anywhere':
        if (sourceStr.includes(matchStr)) return true;
        break;

      case 'entire':
        if (sourceStr === matchStr) return true;
        break;

      case 'ends':
        if (sourceStr.endsWith(matchStr)) return true;
        break;

      case 'starts':
        if (sourceStr.startsWith(matchStr)) return true;
        break;
    }
  }

  return false;
};

export const meetingFromPrismaType = (prismaMeeting: meeting): Meeting => {
  if (prismaMeeting.isTemplate) {
    throw Error(`ID: ${prismaMeeting.id} corresponds to a Template, expecting a Meeting`);
  }
  return {
    ...prismaMeeting,
    phase: prismaMeeting.phase as MeetingPhase,
    isGoalExempt: prismaMeeting.isGoalExempt || false,
    organizationId: prismaMeeting.organizationId,
    isTemplate: false,
  };
};

export const templateFromPrismaType = (prismaMeeting: meeting): Template => {
  if (!prismaMeeting.isTemplate) {
    throw Error(`ID: ${prismaMeeting.id} corresponds to a Meeting, expecting a Template`);
  }
  return {
    ...prismaMeeting,
    phase: prismaMeeting.phase as MeetingPhase,
    isGoalExempt: prismaMeeting.isGoalExempt || false,
    organizationId: prismaMeeting.organizationId,
    isTemplate: true,
  };
};

/*
 * Possibly-temporary way to retroactively update goal-exemptions by setting the column to null in the DB.
 * Maybe worth removing once the functionality settles, though it's pretty low-cost when we don't use it.
 */
export const meetingFromPrismaType_updateGoalExempt = (prismaMeeting: meeting): Meeting => {
  if (prismaMeeting.isGoalExempt === null) {
    const updatedValue = calculateIsGoalExempt(prismaMeeting.title);

    // Intentionally not awaiting since we already know the expected result. Theoretically this could result in
    // duplicate concurrent editMeeting calls but unless that's very common it seems OK.
    updateMeeting({id: prismaMeeting.id, title: prismaMeeting.title});

    return meetingFromPrismaType({...prismaMeeting, isGoalExempt: updatedValue});
  }

  return meetingFromPrismaType(prismaMeeting);
};

// TODO: We started omitting meeting IDs from summary items because we wanted
// to limit access to meetings. Now, we need them back on tasks. Chances are
// we'll want them on decisions, too. Which means we probably just want them
// on summary items after all. For now, I've reenabled them in the SummaryItem
// type but use the second argument to this function to continue to omit them
// for stars and decisions. I've added a backlog item to rationalize this.

export const personFromPrismaType = (prismaPerson: person) => {
  const {id, displayName, picture, lastInvitedDate} = prismaPerson;
  return {id, displayName, picture, lastInvitedDate};
};

const userRecordFromPrismaType = ({
  gcalPushChannel,
  gcalPushChannelExpiration,
  gcalResourceId,
  gcalSyncToken,
  tokens,
  zoomTokens,
  ...rec
}: user): UserRecord => rec;

export const userFromUserRecordType = (userRecord: UserRecord): User => ({
  userId: userRecord.id,
  displayName: getDisplayNameForUserRec(userRecord),
  initials: getInitialsForUserRec(userRecord),
  picture: userRecord.picture || '',
  email: userRecord.loginEmail,
  wipFeature: userRecord.wipFeature,
});

const userFromPrismaType = (user: user): User => userFromUserRecordType(userRecordFromPrismaType(user));

export const noteFromPrismaType = (prismaNote: note): Note => {
  const {meetingId: _meetingId, ...note} = prismaNote;
  return note;
};

export const validateJsonRecordFromPrisma = (json: Prisma.JsonValue): Record<string, any> => {
  // Prisma JsonValue can be string | number | boolean | null | JsonObject | JsonArray
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new ValidationError('Expected db-derived JSON to be an object; got something else.');
  }
  return json;
};

// ---------------------------------------------------------------------------------------------------------------------
//                                                   PROTOCOLS
// ---------------------------------------------------------------------------------------------------------------------
type PrismaFullProtocolType = protocolType & {phases: protocolPhase[]};
type PrismaFullProtocolItem = protocolItem & {creator: user; actions: protocolItemAction[]};
type PrismaFullProtocol = protocol & {
  type: PrismaFullProtocolType;
  items: PrismaFullProtocolItem[];
  currentPhase: protocolPhase;
};

const protocolItemTypeFromPrismaType = (type: PrismaProtocolItemType): ProtocolItemType => {
  switch (type) {
    case 'Group':
      return ProtocolItemType.Group;
    case 'Item':
      return ProtocolItemType.Item;
  }
};

export const protocolPhaseFromPrismaType = ({data, ...prismaProtocolPhase}: protocolPhase): ProtocolPhase => ({
  ...prismaProtocolPhase,
  type: prismaProtocolPhase.type as ProtocolPhaseType,
  data: data as Record<string, any>,
});

export const protocolTypeFromPrismaType = ({
  phases,
  data,
  ...prismaProtocolType
}: PrismaFullProtocolType): ProtocolType => ({
  ...prismaProtocolType,
  phases: phases.map(phase => protocolPhaseFromPrismaType(phase)),
  data: data as Record<string, any>,
});

export const protocolItemFromPrismaType = ({
  data,
  creator,
  type,
  actions,
  ...rest
}: PrismaFullProtocolItem): ProtocolItem => ({
  ...rest,
  actions: actions.map(protocolItemActionFromPrismaType),
  type: protocolItemTypeFromPrismaType(type),
  creator: userFromPrismaType(creator),
  data: validateJsonRecordFromPrisma(data),
});

export const protocolItemActionFromPrismaType = ({data, ...rest}: protocolItemAction): ProtocolItemAction => ({
  ...rest,
  data: validateJsonRecordFromPrisma(data),
});

export const protocolFromPrismaType = ({currentPhase, data, type, items, ...rest}: PrismaFullProtocol): Protocol => ({
  ...rest,
  type: protocolTypeFromPrismaType(type),
  currentPhase: protocolPhaseFromPrismaType(currentPhase),
  phases: type.phases.map(phase => protocolPhaseFromPrismaType(phase)),
  items: items.map(item => protocolItemFromPrismaType(item)),
  data: data as Record<string, any>,
});
