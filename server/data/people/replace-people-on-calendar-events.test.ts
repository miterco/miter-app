import {createBulkPeopleFromAttendees} from './create-bulk-people';
import {v4 as uuid} from 'uuid';
import {fetchPersonByEmail, fetchPersonById} from './fetch-person';
import {fetchCalendarEventPeople} from './fetch-calendar-event-people';
import {Attendee} from '../../server-core/server-types';
import {
  insertTestCalendarEvent,
  insertTestDataForLocking,
  insertTestDomain,
  insertTestNote,
  insertTestNoteAndSummaryItem,
  insertTestOrganizationAndDomain,
  insertTestTopic,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {fetchPeopleByEmailAddresses} from './fetch-people';
import {setOrganizationInternalMeetingsOnly} from './set-organization-internal-meetings-only';
import {fetchMeetingByCalendarEvent} from '../meetings-events/fetch-meeting';
import {BlockingOrganizationId} from './fetch-organization';
import {replacePeopleOnCalendarEvent} from './replace-people-on-calendar-events';

describe('createBulkPeopleFromAttendees', () => {
  it('should create multiple people when given a valid attendee array', async () => {
    const newCalendarEvent = await insertTestCalendarEvent(testName());

    const personId1 = uuid();
    const emailAddress1 = `${personId1}@test.miter.co`;
    const emailAddressId1 = uuid();
    const displayName1 = 'Winchester Pratt';
    const personId2 = uuid();
    const emailAddress2 = `${personId2}@test.miter.co`;
    const emailAddressId2 = uuid();
    const displayName2 = 'Carla Rodriguez';

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

    const addedAttendees = await createBulkPeopleFromAttendees(attendeeArray);

    expect(addedAttendees).toHaveLength(2);
    expect(addedAttendees[0].id).toBeDefined();
    expect(addedAttendees[0].responseStatus).toBe('Accepted');

    const person1 = await fetchPersonByEmail(emailAddress1);
    expect(person1?.displayName).toBe(displayName1);

    const person1a = await fetchPersonById(addedAttendees[0].id);
    expect(person1a?.displayName).toBe('Winchester Pratt');

    await replacePeopleOnCalendarEvent(newCalendarEvent.id, addedAttendees);
    const calendarEventPeople = await fetchCalendarEventPeople(newCalendarEvent.id);
    expect(calendarEventPeople?.length).toBe(2);

    const meeting = await fetchMeetingByCalendarEvent(newCalendarEvent.id);
    expect(meeting.organizationId).toBeFalsy();
  });

  // Note that this is similar to tests for set-organization-internal-meetings-only but order is very important here
  it('should lock a meeting if an org locked person is attending', async () => {
    const {organization, domain} = await insertTestOrganizationAndDomain(testName());
    const notLockedDomain = await insertTestDomain();
    const userToBeLocked = await insertTestUser(testName(), {loginEmail: `${uuid()}@${domain.name}`});
    const notLockedUser = await insertTestUser(testName(), {loginEmail: `${uuid()}@${notLockedDomain.name}`});

    if (!userToBeLocked.personId || !notLockedUser.personId) throw new Error(`Users not properly created`);

    const personToBeLocked = (await fetchPeopleByEmailAddresses([userToBeLocked.loginEmail]))[0];
    const notLockedPerson = (await fetchPeopleByEmailAddresses([notLockedUser.loginEmail]))[0];

    const attendeeArray: Attendee[] = [
      {
        id: userToBeLocked.personId,
        serviceId: userToBeLocked.personId,
        displayName: userToBeLocked.displayName,
        emailAddressId: personToBeLocked.emailAddressId,
        email: personToBeLocked.email,
        optional: false,
        responseStatus: 'Accepted',
      },
      {
        id: notLockedUser.personId,
        serviceId: notLockedUser.personId,
        displayName: notLockedUser.displayName,
        emailAddressId: notLockedPerson.emailAddressId,
        email: notLockedPerson.email,
        optional: false,
        responseStatus: 'Accepted',
      },
    ];

    await setOrganizationInternalMeetingsOnly(organization.id);

    // We are creating the meeting AFTER setting the organization as internal-only
    const calendarEvent = await insertTestCalendarEvent(`For Locking: ${testName()}`);
    await replacePeopleOnCalendarEvent(calendarEvent.id, attendeeArray);

    const meeting = await fetchMeetingByCalendarEvent(calendarEvent.id);
    expect(meeting.organizationId).toBe(organization.id);
  });

  it('should block meetings with conflicting locked orgs', async () => {
    const {organization: lockedOrganization1, domain: lockeddomain1} = await insertTestOrganizationAndDomain(
      testName()
    );
    const {organization: lockedOrganization2, domain: lockeddomain2} = await insertTestOrganizationAndDomain(
      testName()
    );

    const userToBeLocked1 = await insertTestUser(testName(), {loginEmail: `${uuid()}@${lockeddomain1.name}`});
    const userToBeLocked2 = await insertTestUser(testName(), {loginEmail: `${uuid()}@${lockeddomain2.name}`});

    if (!userToBeLocked1.personId || !userToBeLocked2.personId) throw new Error(`Users not properly created`);

    const personToBeLocked1 = (await fetchPeopleByEmailAddresses([userToBeLocked1.loginEmail]))[0];
    const personToBeLocked2 = (await fetchPeopleByEmailAddresses([userToBeLocked2.loginEmail]))[0];

    const attendeeArray: Attendee[] = [
      {
        id: userToBeLocked1.personId,
        serviceId: userToBeLocked1.personId,
        displayName: userToBeLocked1.displayName,
        emailAddressId: personToBeLocked1.emailAddressId,
        email: personToBeLocked1.email,
        optional: false,
        responseStatus: 'Accepted',
      },
      {
        id: userToBeLocked2.personId,
        serviceId: userToBeLocked2.personId,
        displayName: userToBeLocked2.displayName,
        emailAddressId: personToBeLocked2.emailAddressId,
        email: personToBeLocked2.email,
        optional: false,
        responseStatus: 'Accepted',
      },
    ];

    // Again, order important here
    await setOrganizationInternalMeetingsOnly(lockedOrganization1.id);
    await setOrganizationInternalMeetingsOnly(lockedOrganization2.id);

    const calendarEvent = await insertTestCalendarEvent(`For Locking: ${testName()}`);
    await replacePeopleOnCalendarEvent(calendarEvent.id, attendeeArray);

    const meeting = await fetchMeetingByCalendarEvent(calendarEvent.id);
    expect(meeting.organizationId).toBe(BlockingOrganizationId);
  });

  it('should not update after data is added, locked meeting', async () => {
    const {lockedCalendarEvent, lockedMeeting, unlockedPerson} = await insertTestDataForLocking();

    await insertTestNote(lockedCalendarEvent.meetingId, 'Test item');

    // simulate dropping a locked person from a meeting that already has data
    const attendeeArray = [{...unlockedPerson, optional: false, responseStatus: 'Accepted'}];
    await replacePeopleOnCalendarEvent(lockedCalendarEvent.id, attendeeArray);

    const updatedMeeting = await fetchMeetingByCalendarEvent(lockedCalendarEvent.id);
    expect(updatedMeeting.organizationId).toBe(lockedMeeting.organizationId);
  });

  it('should not update after data is added, unlocked meeting', async () => {
    const {unlockedCalendarEvent, unlockedMeeting, lockedPerson, unlockedPerson} = await insertTestDataForLocking();

    await insertTestNoteAndSummaryItem(unlockedCalendarEvent.meetingId, 'Test item');

    // simulate adding a locked person after the meeting has data
    const attendeeArray = [
      {...lockedPerson, optional: false, responseStatus: 'Accepted'},
      {...unlockedPerson, optional: false, responseStatus: 'Accepted'},
    ];
    await replacePeopleOnCalendarEvent(unlockedCalendarEvent.id, attendeeArray);

    const updatedMeeting = await fetchMeetingByCalendarEvent(unlockedCalendarEvent.id);
    expect(updatedMeeting.organizationId).toBeNull();
  });

  it('should not update after data is added, locked meeting even with another locked org involved', async () => {
    const {lockedCalendarEvent, lockedMeeting, lockedPerson, secondLockedPerson} = await insertTestDataForLocking();

    await insertTestTopic(lockedCalendarEvent.meetingId, 'Test item');

    // simulate adding a locked person from another org to meeting that already has data
    const attendeeArray = [
      {...lockedPerson, optional: false, responseStatus: 'Accepted'},
      {...secondLockedPerson, optional: false, responseStatus: 'Accepted'},
    ];
    await replacePeopleOnCalendarEvent(lockedCalendarEvent.id, attendeeArray);

    const updatedMeeting = await fetchMeetingByCalendarEvent(lockedCalendarEvent.id);
    expect(updatedMeeting.organizationId).toBe(lockedMeeting.organizationId);
  });
});
