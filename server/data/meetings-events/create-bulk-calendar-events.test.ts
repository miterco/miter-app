import {fetchCalendarEventByGoogleId} from './fetch-calendar-event';
import {createBulkCalendarEvents} from './create-bulk-calendar-events';
import {v4 as uuid} from 'uuid';
import {Attendee, UnsavedCalendarEventWithAttendees, UserRecord} from '../../server-core/server-types';
import {fetchCalendarEventPeople} from '../people/fetch-calendar-event-people';
import {updateMeeting} from './update-meeting';
import {fetchMeeting, fetchMeetingByCalendarEvent} from './fetch-meeting';
import {fetchMeetingSeries} from './fetch-meeting-series';
import {fetchPeopleByEmailAddresses} from '../people/fetch-people';
import {fetchUserByMiterId} from '../people/fetch-user';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import {fetchPersonByEmail} from '../people/fetch-person';

const domainId = 'a0e2d844-c969-4857-b024-81d789ebb596';
const organizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';

let user: UserRecord | null = null;

beforeAll(async () => {
  user = await fetchUserByMiterId('993093f1-76af-4abb-9bdd-72dfe9ba7b8f');
});

test('createBulkCalendarEvents', async () => {
  const serviceId1 = uuid();
  const serviceId2 = `${serviceId1}_ADDINGASECOND`;
  const status = 'confirmed';

  const getTime = new Date();
  const startDate = getTime;

  getTime.setMinutes(getTime.getMinutes() + 30);
  const endDate = getTime;

  const personId1 = uuid();
  const emailAddress1 = `${personId1}@test.miter.co`;
  const emailAddressId1 = uuid();
  const displayName1 = 'Winchester Pratt';
  const personId2 = uuid();
  const emailAddress2 = `${personId2}@test.miter.co`;
  const emailAddressId2 = uuid();
  const displayName2 = 'Carla Rodriguez';

  const lateAttendeeId = uuid();
  const lateAttendeeEmailAddress = `${lateAttendeeId}@test.miter.co`;
  const lateAttendeeEmailAddressId = uuid();
  const lateAttendeeDisplayName = 'Late Attendee';

  const title1 = 'createBulkCalendarEvents test1 title';
  const title2 = 'createBulkCalendarEvents test2 title';

  const title1Update = 'createBulkCalendarEvents update1 title';

  const recurringId1 = serviceId1;

  const attendeeArray: Attendee[] = [
    {
      id: personId1,
      serviceId: personId1,
      displayName: displayName1,
      emailAddressId: emailAddressId1,
      email: emailAddress1,
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: personId2,
      serviceId: personId2,
      displayName: displayName2,
      emailAddressId: emailAddressId2,
      email: emailAddress2,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const smallerAttendeeArray: Attendee[] = [];
  smallerAttendeeArray.push(attendeeArray[0]);

  const lateAttendeeArray: Attendee[] = attendeeArray.slice();
  lateAttendeeArray.push({
    id: lateAttendeeId,
    serviceId: lateAttendeeId,
    displayName: lateAttendeeDisplayName,
    email: lateAttendeeEmailAddress,
    emailAddressId: lateAttendeeEmailAddressId,
    optional: false,
    responseStatus: 'Accepted',
  });

  const calendarEventsArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title: title1,
      startDate,
      endDate,
      startTime: startDate,
      endTime: endDate,
      serviceId: serviceId1,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: recurringId1,
      recurrenceRule: null,
      googleEventType: 'FirstInstance',
      status,
    },
    {
      title: title2,
      startDate,
      endDate,
      startTime: startDate,
      endTime: endDate,
      serviceId: serviceId2,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: recurringId1,
      recurrenceRule: null,
      googleEventType: 'NthInstance',
      status,
    },
  ];

  const calendarEventArray2: UnsavedCalendarEventWithAttendees[] = [
    {
      title: title1Update,
      startDate,
      endDate,
      startTime: startDate,
      endTime: endDate,
      serviceId: serviceId1,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  const lateAttendeeCalendarEventArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title: title1Update,
      startDate,
      endDate,
      startTime: startDate,
      endTime: endDate,
      serviceId: serviceId1,
      attendees: lateAttendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  const smallerCalendarEventsArray2: UnsavedCalendarEventWithAttendees[] = [
    {
      title: title1Update,
      startDate,
      endDate,
      startTime: startDate,
      endTime: endDate,
      serviceId: serviceId1,
      attendees: smallerAttendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  const newCalendarEvents = await createBulkCalendarEvents(calendarEventsArray, user);

  expect(newCalendarEvents).toHaveLength(2);
  expect(newCalendarEvents[0].title).toBe(title1);

  const fetchCalendarEventResponse = await fetchCalendarEventByGoogleId(serviceId1); // This is a recurring calendar event so we don't have a guaranteed Miter ID
  if (!fetchCalendarEventResponse) throw 'Calendar Event not found';

  expect(fetchCalendarEventResponse.title).toBe(title1);
  expect(fetchCalendarEventResponse.startTime?.toString()).toBe(startDate.toString());
  expect(fetchCalendarEventResponse.endTime?.toString()).toBe(endDate.toString());

  const meetingFor1stInstance = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse.id);
  expect(meetingFor1stInstance.isFirstMeetingInSeries).toBe(true);

  const fetchCalendarEventResponse2 = await fetchCalendarEventByGoogleId(serviceId2); // This is not a recurring calendar event so it should be the Miter ID

  if (!fetchCalendarEventResponse2) throw 'Calendar Event not found';
  expect(fetchCalendarEventResponse2?.title).toBe(title2);
  expect(fetchCalendarEventResponse2?.startTime?.toString()).toBe(startDate.toString());
  expect(fetchCalendarEventResponse2?.endTime?.toString()).toBe(endDate.toString());

  const meetingFor2ndInstance = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse2?.id);
  expect(meetingFor2ndInstance.isFirstMeetingInSeries).toBe(false);

  const newCalendarEvents2 = await createBulkCalendarEvents(calendarEventArray2, user);

  expect(newCalendarEvents2).toHaveLength(1);

  const fetchCalendarEventResponse3 = await fetchCalendarEventByGoogleId(serviceId1); // This is a recurring calendar event so we don't have a guaranteed Miter ID
  if (!fetchCalendarEventResponse3) throw 'Calendar Event not found';

  expect(fetchCalendarEventResponse3.title).toBe(title1Update);

  const newCalendarEvents3 = await createBulkCalendarEvents(smallerCalendarEventsArray2, user);
  expect(newCalendarEvents3).toHaveLength(1);

  const meetingFor3rdInstance = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse3.id);
  expect(meetingFor3rdInstance.isFirstMeetingInSeries).toBe(true);

  const fetchSmallerCalendarEventResponse = await fetchCalendarEventByGoogleId(serviceId1);
  if (fetchSmallerCalendarEventResponse?.id) {
    const fetchSmallerCalendarEventAttendees = await fetchCalendarEventPeople(fetchSmallerCalendarEventResponse.id);
    expect(fetchSmallerCalendarEventAttendees?.length).toBe(1);
  } else throw `Calendar Event not found for Service Id: ${serviceId1}`;

  const lateAttendeeCalendarEventId =
    (await fetchCalendarEventByGoogleId(lateAttendeeCalendarEventArray[0].serviceId))?.id || '';
  const meeting = await fetchMeetingByCalendarEvent(lateAttendeeCalendarEventId);
  const updatedCalendarEvent = await updateMeeting({id: meeting.id, phase: 'InProgress'});
  expect(updatedCalendarEvent?.phase).toBe('InProgress');

  const attendeesWhenStarted = await fetchCalendarEventPeople(lateAttendeeCalendarEventId);
  expect(attendeesWhenStarted?.length).toBe(1);

  const lateAttendeeUpdate = await createBulkCalendarEvents(lateAttendeeCalendarEventArray, user);
  expect(lateAttendeeUpdate).toHaveLength(1);

  if (!lateAttendeeUpdate) throw 'Late attendee meeting not returned';
  const fetchLateAttendeeResult = await fetchCalendarEventPeople(lateAttendeeCalendarEventId);
  expect(fetchLateAttendeeResult?.length).toBe(lateAttendeeCalendarEventArray[0].attendees.length);

  const meetingIsOver = await updateMeeting({id: meeting.id, phase: 'Ended'});
  expect(meetingIsOver?.phase).toBe('Ended');

  const trimDownTheMeeting = await createBulkCalendarEvents(smallerCalendarEventsArray2, user);
  expect(trimDownTheMeeting?.length).toBe(1);

  const calendarEventShouldNotChange = await fetchCalendarEventPeople(lateAttendeeCalendarEventId);
  expect(calendarEventShouldNotChange?.length).toBe(lateAttendeeCalendarEventArray[0].attendees.length);

  const checkOrgAndDomain = (await fetchPeopleByEmailAddresses([emailAddress1]))[0];
  expect(checkOrgAndDomain.domainId).toBe(domainId);
  expect(checkOrgAndDomain.organizationId).toBe(organizationId);
});

test('Create Bulk Calendar Events -> Meeting Logic', async () => {
  const serviceId1 = uuid();
  const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
  const notStartedphase = 'NotStarted';
  const title = 'Meeting Title #1';
  const inProgressTitle = 'Meeting InProgress';
  const endedTitle = 'Ended';
  const unStartedTitle = 'Meeting UnStarted';
  const startedPhase = 'InProgress';
  const status = 'confirmed';

  const getTime = new Date();
  const startTime = new Date(getTime);
  getTime.setMinutes(getTime.getMinutes() + 5);
  const endTime = new Date(getTime);

  const personId = uuid();
  const emailAddress1 = `${personId}@test.miter.co`;
  const emailAddressId1 = uuid();
  const displayName1 = 'Winchester Pratt';

  const attendeeArray: Attendee[] = [
    {
      id: personId,
      serviceId: personId,
      displayName: displayName1,
      emailAddressId: emailAddressId1,
      email: emailAddress1,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const calendarEventsArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title,
      startDate: null,
      endDate: null,
      startTime,
      endTime,
      serviceId: serviceId1,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  const meetingInProgressArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title: inProgressTitle,
      startDate: null,
      endDate: null,
      startTime,
      endTime,
      serviceId: serviceId1,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  const meetingEndedArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title: endedTitle,
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      serviceId: serviceId1,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  getTime.setDate(getTime.getDate() + 1);
  const newStartTime = new Date(getTime);
  getTime.setMinutes(getTime.getMinutes() + 5);
  const newEndTime = new Date(getTime);

  const unStartedMeetingArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title: unStartedTitle,
      startDate: null,
      endDate: null,
      startTime: newStartTime,
      endTime: newEndTime,
      serviceId: serviceId1,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: null,
      recurrenceRule: null,
      googleEventType: 'Single',
      status,
    },
  ];

  const newCalendarEvents = await createBulkCalendarEvents(calendarEventsArray, user);

  expect(newCalendarEvents).toHaveLength(1);
  expect(newCalendarEvents[0].title).toBe(title);

  const fetchCalendarEventResponse = await fetchCalendarEventByGoogleId(serviceId1); // This is a recurring meeting so we don't have a guaranteed Miter ID

  if (!fetchCalendarEventResponse) throw 'Meeting not created!';

  expect(fetchCalendarEventResponse.title).toBe(title);

  const fetchedMeeting = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse.id);
  if (!fetchedMeeting) throw 'Meeting not found';
  if (!fetchedMeeting.startDatetime) throw 'Start Time not added';
  if (!fetchedMeeting.endDatetime) throw 'End Time not added';

  expect(fetchedMeeting.title).toBe(title);
  expect(fetchedMeeting.startDatetime.toString()).toBe(fetchCalendarEventResponse.startTime?.toString());
  expect(fetchedMeeting.endDatetime.toString()).toBe(fetchCalendarEventResponse.endTime?.toString());

  const startTheMeeting = await updateMeeting({id: fetchedMeeting.id, phase: startedPhase});
  expect(startTheMeeting?.phase).toBe(startedPhase);

  const meetingNowInProgress = await createBulkCalendarEvents(meetingInProgressArray, user);
  if (!meetingNowInProgress) throw 'Meeting not updated';

  const shouldBeUpdated = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse.id);
  if (!shouldBeUpdated) throw 'Meeting not found';
  if (!shouldBeUpdated.startDatetime) throw 'Start Time not added';
  if (!shouldBeUpdated.endDatetime) throw 'End Time not added';

  expect(shouldBeUpdated.title).toBe(meetingInProgressArray[0].title);
  expect(shouldBeUpdated.startDatetime.toString()).toBe(meetingInProgressArray[0].startTime?.toString());
  expect(shouldBeUpdated.endDatetime.toString()).toBe(meetingInProgressArray[0].endTime?.toString());

  const endTheMeeting = await updateMeeting({id: fetchedMeeting.id, phase: 'Ended'});
  expect(endTheMeeting?.phase).toBe('Ended');

  const meetingEnded = await createBulkCalendarEvents(meetingEndedArray, user);
  const shouldStillBeSame = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse.id);
  if (!shouldStillBeSame.startDatetime) throw 'Start Time not added';
  if (!shouldStillBeSame.endDatetime) throw 'End Time not added';

  expect(shouldStillBeSame.title).toBe(shouldBeUpdated.title);
  expect(shouldStillBeSame.startDatetime).toEqual(shouldBeUpdated.startDatetime);
  expect(shouldStillBeSame.endDatetime).toEqual(shouldStillBeSame.endDatetime);

  const unStartTheMeeting = await updateMeeting({id: shouldBeUpdated.id, phase: notStartedphase});
  expect(unStartTheMeeting?.phase).toBe(notStartedphase);

  const meetingNowUnstarted = await createBulkCalendarEvents(unStartedMeetingArray, user);
  if (!meetingNowUnstarted) throw 'Meeting not updated';

  const shouldHaveNewValues = await fetchMeetingByCalendarEvent(fetchCalendarEventResponse.id);
  if (!shouldHaveNewValues) throw 'Meeting not found';
  if (!shouldHaveNewValues.startDatetime) throw 'Start Time not added';
  if (!shouldHaveNewValues.endDatetime) throw 'End Time not added';

  expect(shouldHaveNewValues.title).toBe(unStartedTitle);
  const newStartDatetime = shouldHaveNewValues.startDatetime.getTime();
  console.log(newStartDatetime);
  console.log(shouldHaveNewValues.startDatetime);
  const oldStartDatetime = shouldStillBeSame.startDatetime.getTime();
  console.log(oldStartDatetime);
  console.log(shouldStillBeSame.startDatetime);

  expect(shouldHaveNewValues.startDatetime.getTime()).toBeGreaterThan(shouldStillBeSame.startDatetime.getTime());
  expect(shouldHaveNewValues.endDatetime.getTime()).toBeGreaterThan(shouldStillBeSame.endDatetime.getTime());
});

test('CreateBulkCalendarEvents - cancelled meeting', async () => {
  const serviceId = uuid();
  const title = 'This meeting is about to be CANCELLED';
  const googleEventType = 'Single';
  const recurringCalendarEventServiceId = null;
  const status = 'confirmed';

  const getTime = new Date(new Date().setHours(0, 0, 0, 0));
  const startDate = new Date(getTime);
  const endDate = new Date(getTime);
  getTime.setMinutes(getTime.getMinutes() + 5);
  const startTime = new Date(getTime);
  getTime.setMinutes(getTime.getMinutes() + 5);
  const endTime = new Date(getTime);

  const user = await insertTestUser(testName());
  if (!user.personId) throw new Error('Malformed user');
  const {personId} = user;
  const emailAddress1 = user.loginEmail;
  const person1 = await fetchPersonByEmail(emailAddress1);

  const emailAddressId1 = person1?.emailAddress[0].id;
  if (!emailAddressId1) throw new Error('Email Address not found');
  const displayName1 = user.displayName;

  const attendeeArray: Attendee[] = [
    {
      id: personId,
      serviceId: person1?.serviceId,
      displayName: displayName1,
      emailAddressId: emailAddressId1,
      email: emailAddress1,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const calendarEventsArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title,
      startDate,
      endDate,
      startTime,
      endTime,
      serviceId,
      attendees: attendeeArray,
      recurringCalendarEventServiceId,
      recurrenceRule: null,
      googleEventType,
      status,
    },
  ];

  const meetingCancelledArray: UnsavedCalendarEventWithAttendees[] = [
    {
      title: '',
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      serviceId,
      attendees: [],
      recurringCalendarEventServiceId,
      recurrenceRule: null,
      googleEventType,
      status: 'cancelled',
    },
  ];

  const newCalendarEvents = await createBulkCalendarEvents(calendarEventsArray, user);

  expect(newCalendarEvents).toHaveLength(1);
  expect(newCalendarEvents[0].title).toBe(title);

  const fetchCalendarEventResponseBefore = await fetchCalendarEventByGoogleId(serviceId); // This is a recurring meeting so we don't have a guaranteed Miter ID

  if (!fetchCalendarEventResponseBefore) throw 'Meeting not created!';
  expect(fetchCalendarEventResponseBefore.title).toBe(title);

  const inviteesBefore = await fetchCalendarEventPeople(fetchCalendarEventResponseBefore.id);
  expect(inviteesBefore).toHaveLength(1);

  const tryToCancel = await createBulkCalendarEvents(meetingCancelledArray, user);
  expect(tryToCancel).toHaveLength(0);

  const fetchCalendarEventResponseAfter = await fetchCalendarEventByGoogleId(serviceId);
  if (!fetchCalendarEventResponseAfter) throw new Error('Calendar Event not found');
  expect(fetchCalendarEventResponseAfter?.title).toBe(fetchCalendarEventResponseBefore.title);

  const inviteesAfter = await fetchCalendarEventPeople(fetchCalendarEventResponseAfter.id);
  expect(inviteesAfter).toHaveLength(0);
});

test('createBulkCalendarEvents - Updates Recurring Meeting Title', async () => {
  const serviceId = uuid();
  const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
  const status = 'confirmed';
  const recurrenceRule = '"["RRULE:FREQ=DAILY"]"';

  const getTime = new Date(new Date().setHours(0, 0, 0, 0));
  const startDate = new Date(getTime);
  const endDate = new Date(getTime);
  getTime.setMinutes(getTime.getMinutes() + 5);
  const startTime = new Date(getTime);
  getTime.setMinutes(getTime.getMinutes() + 5);
  const endTime = new Date(getTime);

  const personId = uuid();
  const emailAddress1 = `${personId}@test.miter.co`;
  const emailAddressId1 = uuid();
  const displayName1 = 'Winchester Pratt';
  const googleEventType = 'FirstInstance';

  const title1 = 'Title 1';
  const title2 = 'Title 2';

  const attendeeArray: Attendee[] = [
    {
      id: personId,
      serviceId: personId,
      displayName: displayName1,
      emailAddressId: emailAddressId1,
      email: emailAddress1,
      optional: false,
      responseStatus: 'Accepted',
    },
  ];

  const calendarEventsArrayBlank: UnsavedCalendarEventWithAttendees[] = [
    {
      title: null,
      startDate,
      endDate,
      startTime,
      endTime,
      serviceId,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: serviceId,
      recurrenceRule,
      googleEventType,
      status,
    },
  ];

  const calendarEventsArrayTitle1: UnsavedCalendarEventWithAttendees[] = [
    {
      title: title1,
      startDate,
      endDate,
      startTime,
      endTime,
      serviceId,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: serviceId,
      recurrenceRule,
      googleEventType,
      status,
    },
  ];

  const calendarEventsArrayTitle2: UnsavedCalendarEventWithAttendees[] = [
    {
      title: title2,
      startDate,
      endDate,
      startTime,
      endTime,
      serviceId,
      attendees: attendeeArray,
      recurringCalendarEventServiceId: serviceId,
      recurrenceRule,
      googleEventType,
      status,
    },
  ];

  const initialCall = await createBulkCalendarEvents(calendarEventsArrayBlank, user);
  if (!initialCall || !initialCall[0]) throw `Calendar Event not created`;

  const {meetingId} = initialCall[0];
  const meeting = await fetchMeeting(meetingId);
  const meetingSeriesId = (await fetchMeeting(meetingId))?.meetingSeriesId;

  if (!meetingSeriesId) throw `Meeting Series not created`;
  const initialTitle = (await fetchMeetingSeries(meetingSeriesId)).title;
  expect(initialTitle).toBeFalsy();

  await createBulkCalendarEvents(calendarEventsArrayTitle1, user);
  const newTitle = (await fetchMeetingSeries(meetingSeriesId)).title;
  expect(newTitle).toBe(title1);

  await createBulkCalendarEvents(calendarEventsArrayTitle2, user);
  const shouldBeSameTitle = (await fetchMeetingSeries(meetingSeriesId)).title;
  expect(shouldBeSameTitle).toBe(title1);
});
