import fs from 'fs';
import {ProductSurface, ProtocolPhaseType, SignUpService} from '@prisma/client';
import {
  EmailRecipient,
  Note,
  Meeting,
  SummaryItem,
  Topic,
  MeetingPhase,
  MeetingToken,
  ProtocolItemType,
} from 'miter-common/SharedTypes';
import {
  Attendee,
  EmailJobName,
  FullCalendarEventRecord,
  FullPersonWithEmail,
  SummaryItemRecord,
  UnsavedCalendarEventWithAttendees,
  UserRecord,
} from '../server-core/server-types';
import {createUser} from '../data/people/create-user';
import {createCalendarEvent} from '../data/meetings-events/create-calendar-event';
import {createMeeting} from '../data/meetings-events/create-meeting';
import {createNote} from '../data/notes-items/create-note';
import {pinNote} from '../data/notes-items/pin-note';
import {createTopic} from '../data/topics/create-topic';
import {createBulkPeopleFromAttendees} from '../data/people/create-bulk-people';
import {fetchMeeting, fetchMeetingByCalendarEvent} from '../data/meetings-events/fetch-meeting';
import {createBulkCalendarEvents} from '../data/meetings-events/create-bulk-calendar-events';
import {saveAssociatedPeopleForNote} from '../data/notes-items/update-associated-people';
import {createSummaryItem} from '../data/notes-items/create-summary-item';
import {Hours, uuid, Weeks} from 'miter-common/CommonUtil';
import {setCurrentTopicForMeeting} from '../data/topics/set-current-topic-for-meeting';
import {fetchOrCreateMeetingTokenByMeetingId} from '../data/fetch-token';
import {createPerson} from '../data/people/create-person';
import {calendar_v3} from 'googleapis';
import {convertGoogleEventsToCalendarEvents} from '../google-apis/google-calendar';
import {createDomains} from '../data/people/create-domains';
import {createOrganization} from '../data/people/create-organization';
import {fetchDomainByName} from '../data/people/fetch-domain';
import {createAuthToken} from '../data/auth-tokens/create-auth-token';
import {setOrganizationInternalMeetingsOnly} from '../data/people/set-organization-internal-meetings-only';
import {fetchPeopleByEmailAddresses} from '../data/people/fetch-people';
import {fetchOrganizationById} from '../data/people/fetch-organization';
import {replacePeopleOnCalendarEvent} from '../data/people/replace-people-on-calendar-events';
import {createProtocol} from '../data/protocol/create-protocol';
import {createProtocolType} from '../data/protocol/types/create-protocol-type';
import {createProtocolPhase} from '../data/protocol/phases/create-protocol-phase';
import {createProtocolItem} from '../data/protocol/items/create-protocol-item';
import {deleteProtocolTypeById} from '../data/protocol/types/delete-protocol-type';
import {deleteProtocolById} from '../data/protocol/delete-protocol';
import {deleteProtocolPhaseById} from '../data/protocol/phases/delete-protocol-phase';
import {deletePersonById} from '../data/people/delete-person';
import {deleteProtocolItemById} from '../data/protocol/items/delete-protocol-item';
import {createAutomatedEmailJob} from '../data/jobs/create-email-job';
import {fetchEmailJobsForMeeting} from '../data/jobs/fetch-email-job';

export const testName = () => expect.getState().currentTestName;

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Los_Angeles',
};

export const testEmailRecipientList: EmailRecipient[] = [
  {email: 'email-testing+alvintest@test.miter.co', name: 'Alvin Chan'},
  {email: 'email-testing+wilsontest@test.miter.co', name: 'Wilson Smith'},
  {email: 'email-testing+sampleemailc@test.miter.co'},
];

export const TestUserId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const getTime = new Date();
const startTime = getTime;
getTime.setMinutes(getTime.getMinutes() + 30);
const endTime = getTime;
const phase: MeetingPhase = 'NotStarted';

// -------------------------------------------------------------------------------------------------
//                                     MEETINGS & CALENDAR EVENTS
// -------------------------------------------------------------------------------------------------

// readableIdentifier param gets inserted into various string values so we can see it in the output later
export const insertTestCalendarEvent = async (readableIdentifier: string, includeServiceId: boolean = false) => {
  const calendarEvent = await createCalendarEvent({
    title: `${readableIdentifier} - meeting title`,
    startDate: null,
    endDate: null,
    startTime,
    endTime,
    serviceId: includeServiceId ? uuid() : null,
  });
  return calendarEvent;
};

export const insertTestMeeting = async (
  readableIdentifier: string,
  additionalFields?: Partial<Meeting>
): Promise<Meeting> => {
  const meeting = await createMeeting({
    title: readableIdentifier,
    goal: `${readableIdentifier} - meeting goal`,
    startDatetime: startTime,
    endDatetime: endTime,
    allDay: false,
    phase,
    zoomMeetingId: null,
    zoomNumericMeetingId: null,
    organizationId: null,
    ...additionalFields,
  });
  if (!meeting) throw new Error('insertTestMeeting failed to create a meeting.');

  return meeting;
};

export const insertTestMeetingAndToken = async (
  readableIdentifier: string,
  additionalMeetingFields?: Partial<Meeting>
): Promise<[Meeting, MeetingToken]> => {
  const meeting = await insertTestMeeting(readableIdentifier, additionalMeetingFields);
  const meetingToken = await fetchOrCreateMeetingTokenByMeetingId(meeting.id);

  if (!meetingToken) throw new Error('insertTestMeetingAndToken failed to create a meeting token.');

  return [meeting, meetingToken];
};

export const insertTestCalendarEventAndMeetingAndToken = async (
  readableIdentifier: string
): Promise<[FullCalendarEventRecord, Meeting, MeetingToken | null]> => {
  const {meeting, calendarEvent} = await insertTestMeetingAndCalendarEvent(readableIdentifier);
  const meetingToken = await fetchOrCreateMeetingTokenByMeetingId(meeting.id);
  return [calendarEvent, meeting, meetingToken];
};

export const insertTestMeetingAndCalendarEvent = async (
  readableIdentifier: string
): Promise<{meeting: Meeting; calendarEvent: FullCalendarEventRecord}> => {
  const calendarEvent = await insertTestCalendarEvent(readableIdentifier, true);
  if (!calendarEvent) throw 'Calendar Event not created';

  const meeting = await fetchMeetingByCalendarEvent(calendarEvent.id);
  if (!meeting) throw 'Meeting not created';

  return {meeting, calendarEvent};
};

export const insertBulkTestCalendarEvents = async (
  identifier: string,
  count: number,
  desiredStartDate?: Date,
  desiredAttendees?: Attendee[]
): Promise<FullCalendarEventRecord[]> => {
  const personId = uuid();
  const email = `${personId}@test.miter.co`;
  const emailAddressId = uuid();
  const displayName = 'Need an attendee.';
  const title = identifier;
  const status = 'confirmed';

  const user = await insertTestUser(testName());
  const baseId = uuid();
  const baseStartTime = desiredStartDate?.getTime() || new Date(2021, 10, 5, 10, 0).getTime();
  const baseEndTime = desiredStartDate ? desiredStartDate.getTime() + Hours : new Date(2021, 10, 5, 11, 0).getTime();

  const attendeeArray: Attendee[] = desiredAttendees || [
    {
      id: uuid(),
      displayName,
      emailAddressId,
      email,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const calendarEventsArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title,
      startDate: null,
      endDate: null,
      startTime: new Date(baseStartTime),
      endTime: new Date(baseEndTime),
      serviceId: baseId,
      recurringCalendarEventServiceId: baseId,
      googleEventType: 'FirstInstance',
      status,
      recurrenceRule: '["RRULE:FREQ=WEEKLY;BYDAY=TU"]',
      attendees: attendeeArray,
    },
  ];

  for (let i = 1; i < count; i++) {
    const startTime = new Date(baseStartTime + i * Weeks);
    const endTime = new Date(baseEndTime + i * Weeks);

    calendarEventsArray.push({
      title,
      startDate: null,
      endDate: null,
      startTime,
      endTime,
      serviceId: `${baseId}_${startTime.toString()}`,
      recurringCalendarEventServiceId: baseId,
      googleEventType: 'NthInstance',
      status,
      recurrenceRule: null,
      attendees: attendeeArray,
    });
  }

  const newCalendarEvents = await createBulkCalendarEvents(calendarEventsArray, user);

  if (!newCalendarEvents || newCalendarEvents.length === 0) throw 'Bulk Calendar Events not created';

  return newCalendarEvents;
};

// -------------------------------------------------------------------------------------------------
//                                          TOPICS
// -------------------------------------------------------------------------------------------------

export const insertTestTopic = async (
  meetingId: string,
  text: string,
  additionalFields?: Partial<Topic>
): Promise<Topic> => {
  const newTopic = await createTopic({meetingId, text, ...additionalFields});
  if (!newTopic) throw 'Topic not created';

  return newTopic;
};

// -------------------------------------------------------------------------------------------------
//                                   NOTES & SUMMARY ITEMS
// -------------------------------------------------------------------------------------------------

export const insertTestNote = async (
  meetingId: string,
  itemText: string,
  additionalFields?: Partial<Note>
): Promise<Note> => {
  const itemType = 'None';
  const targetDate = null;
  const createdBy = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
  const {note: newNote} = await createNote({meetingId, itemText, itemType, targetDate, createdBy, ...additionalFields});
  if (!newNote) throw 'Note not created';
  await saveAssociatedPeopleForNote(newNote);

  return newNote;
};

export const insertTestNoteAndSummaryItem = async (
  meetingId: string,
  itemText: string,
  additionalFields?: Partial<Note>
) => {
  const note = await insertTestNote(meetingId, itemText, {...additionalFields, itemType: undefined});
  const {summaryItem} = await pinNote({id: note.id, itemType: additionalFields?.itemType || 'Decision'});
  return {summaryItem, note};
};

export const insertTestSummaryItem = async (
  meetingId: string | null,
  itemText: string,
  additionalFields?: Partial<SummaryItem>
): Promise<SummaryItem> => {
  return await createSummaryItem({
    ...additionalFields,
    meetingId,
    itemText,
    createdBy: additionalFields?.createdBy || null,
    protocolId: additionalFields?.protocolId || null,
    noteId: additionalFields?.noteId || null,
    itemType: additionalFields?.itemType || 'Task',
    targetDate: additionalFields?.targetDate || null,
  });
};

export const insertMultipleTestSummaryItems = async (
  identifier: string,
  count: number,
  additionalFields: Partial<Omit<SummaryItemRecord, 'id' | 'timestamp'>>
) => {
  const result: SummaryItem[] = [];
  for (let i = 0; i < count; i++) {
    result.push(
      await createSummaryItem({
        meetingId: additionalFields.meetingId || 'NO_MEETING_ID',
        createdBy: additionalFields.createdBy || null,
        noteId: additionalFields.noteId || null,
        topicId: additionalFields.topicId,
        itemType: additionalFields.itemType || 'Task',
        itemText: additionalFields.itemText || `${identifier} - Test Item ${i}`,
        itemText2: additionalFields.itemText2,
        taskProgress: additionalFields.taskProgress,
        itemOwnerId: additionalFields.itemOwnerId,
        targetDate: additionalFields.targetDate || null,
      })
    );
  }

  return result;
};

// -------------------------------------------------------------------------------------------------
//                                      ORGANIZATIONS & DOMAINS
// -------------------------------------------------------------------------------------------------

export const insertTestDomain = async () => {
  const domainName = `${uuid()}.com`;

  const domains = await createDomains([domainName]);
  if (domains.length === 0) throw new Error('Domain not created');
  return domains[0];
};

export const insertTestOrganizationAndDomain = async (readableIdentifier: string) => {
  const domainName = `${uuid()}.com`;

  const organization = await createOrganization(readableIdentifier, [domainName]);
  const domain = await fetchDomainByName(domainName);
  if (!domain) throw new Error(`Domain not craeted`);
  return {organization, domain};
};

// -------------------------------------------------------------------------------------------------
//                                      USERS & PEOPLE
// -------------------------------------------------------------------------------------------------

export const insertTestUser = async (readableIdentifier: string, additionalFields?: Partial<UserRecord>) => {
  const proto: Omit<UserRecord, 'id' | 'personId'> = {
    serviceId: uuid(),
    zoomUserId: uuid(),
    displayName: `${readableIdentifier} - Display Name`,
    firstName: 'First',
    lastName: 'Last',
    loginEmail: `${uuid()}@example.com`,
    picture: `https://fakePictureUrl${readableIdentifier}`,
    signUpService: SignUpService.Google,
    signUpProductSurface: ProductSurface.ChromeExtension,
    ...additionalFields,
  };

  const user = await createUser(proto, {}, {}, false);
  if (!user) throw new Error('insertTestUser failed to create a user.');

  return user;
};

export const insertTestPerson = async (readableIdentifier: string, emailDomain: string) => {
  const proto: Omit<FullPersonWithEmail, 'id' | 'emailAddressId'> = {
    displayName: readableIdentifier,
    email: `${uuid()}@${emailDomain}`,
  };
  const person = await createPerson(proto);
  if (!person) throw new Error('insertTestPerson failed to create a person.');
  return person;
};

export const insertMultipleTestUsers = async (readableIdentifier: string, count: number) => {
  const result: UserRecord[] = [];
  for (let i = 0; i < count; i++) {
    result.push(await insertTestUser(`${readableIdentifier} - ${i}`));
  }

  return result;
};

export const insertTestPeopleFromAttendees = async (identifier: string, count: number) => {
  const input: Attendee[] = [];
  for (let i = 0; i < count; i++) {
    input.push({
      id: uuid(),
      email: `${uuid()}@test.miter.co`,
      emailAddressId: uuid(),
      displayName: `{$identifier} - Name - ${i}`,
      picture: `${identifier} - Pic - ${i}`,
      optional: false,
      responseStatus: 'Accepted',
    });
  }

  return await createBulkPeopleFromAttendees(input);
};

// -------------------------------------------------------------------------------------------------
//                                            COMBO
// -------------------------------------------------------------------------------------------------

export const insertBaseTestDataForNotesOrItemsEndpoint = async (includeCurrentTopic: boolean = false) => {
  let topic: Topic | null = null;

  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  if (includeCurrentTopic) {
    topic = await insertTestTopic(meeting.id, testName());
    await setCurrentTopicForMeeting(meeting, topic.id);
  }
  const user = await insertTestUser(testName());

  return {meeting, user, topic};
};

export const insertUnlockedOrganizationDomainUserAndTokens = async (readableIdentifier: string) => {
  const {organization, domain} = await insertTestOrganizationAndDomain(`${readableIdentifier}: ${uuid()}`);
  const user = await insertTestUser(testName(), {loginEmail: `${uuid()}@${domain.name}`});
  const {accessToken, refreshToken} = await createAuthToken(user.id);

  return {organization, domain, user, accessToken, refreshToken};
};

export const insertLockedOrganizationDomainUserAndTokens = async (readableIdentifier: string) => {
  const {organization, domain, user, accessToken, refreshToken} = await insertUnlockedOrganizationDomainUserAndTokens(
    readableIdentifier
  );

  await setOrganizationInternalMeetingsOnly(organization.id);
  return {organization, domain, user, accessToken, refreshToken};
};

// -------------------------------------------------------------------------------------------------
//                                       Sample GCal Data
//
// These functions centralize our use of test GCal-API JSON. The idPrefix stuff is so every time we run these,
// we get a new set of service IDs derived from the static ones in the JSON, which will help avoid situations
// in which tests interfere with one another.
// -------------------------------------------------------------------------------------------------

export type RawGCalEvent = calendar_v3.Schema$Event;

const _getGCalEvents = (filenameBase: string) => async () => {
  const rawEvents = JSON.parse(fs.readFileSync(`./testing/${filenameBase}.json`, 'utf8')) as calendar_v3.Schema$Event[];
  const idPrefix = `${Date.now()}`;
  rawEvents.forEach(event => {
    if (event.id) event.id = idPrefix + event.id;
    if (event.iCalUID) event.iCalUID = idPrefix + event.iCalUID;
    if (event.recurringEventId) event.recurringEventId = idPrefix + event.recurringEventId;
  });

  const transformedEvents = await convertGoogleEventsToCalendarEvents(
    rawEvents,
    '9967f2d3-3c01-4f5a-a62a-f27ddc2ca1b3',
    'Test Data'
  );

  return {rawEvents, transformedEvents, idPrefix};
};
export const getSampleGCalEvents = _getGCalEvents('gcal-list-events-result');
export const getGCalEventPermutations = _getGCalEvents('endpoint-event-list');

// -------------------------------------------------------------------------------------------------
//                                            Meeting Locking Test Function
// -------------------------------------------------------------------------------------------------

export const insertTestDataForLocking = async () => {
  const {organization: _lockedOrganization, domain: lockedDomain} = await insertTestOrganizationAndDomain(
    `join-meeting-endpoint-testing ${uuid()}`
  );
  const {organization: _secondLockedOrganization, domain: secondLockedDomain} = await insertTestOrganizationAndDomain(
    `join-meeting-endpoint-testing ${uuid()}`
  );

  await setOrganizationInternalMeetingsOnly(_lockedOrganization.id);
  await setOrganizationInternalMeetingsOnly(_secondLockedOrganization.id);

  const lockedOrganization = await fetchOrganizationById(_lockedOrganization.id);
  const secondLockedOrganization = await fetchOrganizationById(_secondLockedOrganization.id);

  const {organization: unlockedOrganization, domain: unlockedDomain} = await insertTestOrganizationAndDomain(
    `join-meeting-endpoint-testing ${uuid()}`
  );
  const secondUnlockedDomain = await insertTestDomain();
  const lockedUser = await insertTestUser(testName(), {loginEmail: `${uuid()}@${lockedDomain.name}`});
  const unlockedUser = await insertTestUser(testName(), {loginEmail: `${uuid()}@${unlockedDomain.name}`});
  const secondLockedUser = await insertTestUser(testName(), {loginEmail: `${uuid()}@${secondLockedDomain.name}`});
  const secondUnlockedUser = await insertTestUser(testName(), {loginEmail: `${uuid()}@${secondUnlockedDomain.name}`});

  if (!lockedUser.personId || !unlockedUser.personId || !secondLockedUser.personId || !secondUnlockedUser.personId) {
    throw new Error(`Users not properly created`);
  }

  const lockedPerson = (await fetchPeopleByEmailAddresses([lockedUser.loginEmail]))[0];
  const unlockedPerson = (await fetchPeopleByEmailAddresses([unlockedUser.loginEmail]))[0];
  const secondLockedPerson = (await fetchPeopleByEmailAddresses([secondLockedUser.loginEmail]))[0];
  const secondUnlockedPerson = (await fetchPeopleByEmailAddresses([secondUnlockedUser.loginEmail]))[0];

  const lockedAttendeeArray: Attendee[] = [
    {
      id: lockedUser.personId,
      serviceId: lockedUser.personId,
      displayName: lockedUser.displayName,
      emailAddressId: lockedPerson.emailAddressId,
      email: lockedPerson.email,
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: unlockedUser.personId,
      serviceId: unlockedUser.personId,
      displayName: unlockedUser.displayName,
      emailAddressId: unlockedPerson.emailAddressId,
      email: unlockedPerson.email,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const unlockedAttendeeArray: Attendee[] = [
    {
      id: unlockedUser.personId,
      serviceId: unlockedUser.personId,
      displayName: unlockedUser.displayName,
      emailAddressId: unlockedPerson.emailAddressId,
      email: unlockedPerson.email,
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: secondUnlockedUser.personId,
      serviceId: secondUnlockedUser.personId,
      displayName: secondUnlockedUser.displayName,
      emailAddressId: secondUnlockedPerson.emailAddressId,
      email: secondUnlockedPerson.email,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const blockedAttendeeArray: Attendee[] = [
    {
      id: lockedUser.personId,
      serviceId: lockedUser.personId,
      displayName: lockedUser.displayName,
      emailAddressId: lockedPerson.emailAddressId,
      email: lockedPerson.email,
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: secondLockedUser.personId,
      serviceId: secondLockedUser.personId,
      displayName: secondLockedUser.displayName,
      emailAddressId: secondLockedPerson.emailAddressId,
      email: secondLockedPerson.email,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const [lockedCalendarEvent, _lockedMeeting, lockedMeetingToken] = await insertTestCalendarEventAndMeetingAndToken(
    `For Locking: ${testName()}`
  );

  const [unlockedCalendarEvent, _unlockedMeeting, unlockedMeetingToken] =
    await insertTestCalendarEventAndMeetingAndToken(`Not Locked: ${testName()}`);

  const [blockedCalendarEvent, _blockedMeeting, blockedMeetingToken] = await insertTestCalendarEventAndMeetingAndToken(
    `For Locking: ${testName()}`
  );

  await replacePeopleOnCalendarEvent(lockedCalendarEvent.id, lockedAttendeeArray);
  await replacePeopleOnCalendarEvent(unlockedCalendarEvent.id, unlockedAttendeeArray);
  await replacePeopleOnCalendarEvent(blockedCalendarEvent.id, blockedAttendeeArray);

  const lockedMeeting = await fetchMeeting(_lockedMeeting.id);
  const blockedMeeting = await fetchMeeting(_blockedMeeting.id);
  const unlockedMeeting = await fetchMeeting(_unlockedMeeting.id);

  if (!lockedMeetingToken || !unlockedMeetingToken || !blockedMeetingToken) throw new Error('Meetings not created');

  return {
    lockedPerson,
    secondLockedPerson,
    unlockedPerson,
    secondUnlockedPerson,
    lockedUser,
    secondLockedUser,
    unlockedUser,
    secondUnlockedUser,
    lockedCalendarEvent,
    blockedCalendarEvent,
    unlockedCalendarEvent,
    lockedMeeting,
    blockedMeeting,
    unlockedMeeting,
    lockedMeetingToken,
    blockedMeetingToken,
    unlockedMeetingToken,
    lockedOrganization,
    unlockedOrganization,
    secondLockedOrganization,
  };
};

//----------------------------------------------------------------------------------------------------------------------
//                                                    PROTOCOLS
//----------------------------------------------------------------------------------------------------------------------

interface InsertTestProtocolData {
  items?: string[]; // Item text.
  phases?: string[]; // Phase names.
  actions?: string[]; // Action types.
  excludeProtocol?: boolean;
}

export const insertTestProtocol = async (readableName: string, data: InsertTestProtocolData) => {
  const creator = await insertTestUser(readableName);
  const protocolType = await createProtocolType({
    name: `${readableName} - Protocol Type`,
    description: `${readableName} - Description`,
  });

  const protocolPhases = data.phases
    ? await Promise.all(
        data.phases.map((name: string, index: number) =>
          createProtocolPhase({
            name,
            type: ProtocolPhaseType.SingleResponse,
            description: 'This is the description for the protocol phase',
            protocolTypeId: protocolType.id,
            isCollective: false,
            index,
          })
        )
      )
    : [];

  const protocol =
    protocolPhases.length > 0 && !data.excludeProtocol
      ? await createProtocol({
          title: `${readableName} - Protocol`,
          typeId: protocolType.id,
          creatorId: creator.id,
        })
      : null;

  const protocolItems =
    protocol && data.items
      ? await Promise.all(
          data.items.map((text: string) =>
            createProtocolItem({
              text,
              protocolId: protocol.id,
              creatorId: creator.id,
              protocolPhaseId: protocolPhases[0].id,
              type: ProtocolItemType.Item,
            })
          )
        )
      : [];

  const deleteTestProtocol = async ({
    excludeItems = false,
    excludeProtocol = false,
    excludePhases = false,
    excludeType = false,
    excludeCreator = false,
  } = {}) => {
    if (!excludeItems) await Promise.all(protocolItems.map(({id}) => deleteProtocolItemById(id))); // Protocol items.
    if (!excludeProtocol && protocol) await deleteProtocolById(protocol.id); // Protocol instance.
    if (!excludePhases) await Promise.all(protocolPhases.map(({id}) => deleteProtocolPhaseById(id))); // Protocol phases.
    if (!excludeType) await deleteProtocolTypeById(protocolType.id); // Protocol type.
    // if (!excludeCreator) await deletePersonById(creator.id); // Protocol creator.
  };

  return {creator, protocolType, protocolPhases, protocolItems, protocol, deleteTestProtocol};
};

// -------------------------------------------------------------------------------------------------
//                                             JOBS
// -------------------------------------------------------------------------------------------------

export const insertTestAutomatedEmailJob = async (meetingId?: string) => {
  const sendAfterDate = new Date();
  const _meetingId = meetingId || (await insertTestMeeting(testName())).id;
  await createAutomatedEmailJob({
    jobName: EmailJobName.SummaryEmail,
    meetingId: _meetingId,
    sendAfter: sendAfterDate,
    jobRecipients: testEmailRecipientList,
  });
  return (await fetchEmailJobsForMeeting(_meetingId))[0];
};
