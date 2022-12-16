import {uuid} from 'miter-common/CommonUtil';
import {Attendee} from '../../server-core/server-types';
import {
  insertTestCalendarEvent,
  insertTestDomain,
  insertTestOrganizationAndDomain,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {fetchMeetingByCalendarEvent} from '../meetings-events/fetch-meeting';
import {BlockingOrganizationId, fetchOrganizationById} from './fetch-organization';
import {fetchPeopleByEmailAddresses} from './fetch-people';
import {replacePeopleOnCalendarEvent} from './replace-people-on-calendar-events';
import {setOrganizationInternalMeetingsOnly} from './set-organization-internal-meetings-only';

describe('setOrganizationInternalMeetingsOnly', () => {
  it('should set an existing organization to have isLocked = true', async () => {
    const {organization} = await insertTestOrganizationAndDomain(testName());

    await setOrganizationInternalMeetingsOnly(organization.id);
    const updatedOrganization = await fetchOrganizationById(organization.id);
    expect(updatedOrganization.isLocked).toBeTruthy();
  });

  // Note that this is similar to tests for add-people-to-calendar-event but order is very important here

  it('should update lockedOrganization to that org id for existing meetings with invitees in that org', async () => {
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

    const calendarEvent = await insertTestCalendarEvent(`For Locking: ${testName()}`);
    await replacePeopleOnCalendarEvent(calendarEvent.id, attendeeArray);

    // We are setting the organization as internal-only AFTER creating the meeting

    await setOrganizationInternalMeetingsOnly(organization.id);

    const meeting = await fetchMeetingByCalendarEvent(calendarEvent.id);
    expect(meeting.organizationId).toBe(organization.id);
  });

  it('should not update lockedOrganization on org id for existing meetings with no invitees from that org', async () => {
    const {organization, domain} = await insertTestOrganizationAndDomain(testName());
    const notLockedDomain = await insertTestDomain();
    const notLockedUser = await insertTestUser(testName(), {loginEmail: `${uuid()}@${notLockedDomain.name}`});

    if (!notLockedUser.personId) throw new Error(`Users not properly created`);

    const notLockedPerson = (await fetchPeopleByEmailAddresses([notLockedUser.loginEmail]))[0];

    const attendeeArray: Attendee[] = [
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

    const calendarEvent = await insertTestCalendarEvent(`For Locking: ${testName()}`);
    await replacePeopleOnCalendarEvent(calendarEvent.id, attendeeArray);

    await setOrganizationInternalMeetingsOnly(organization.id);

    const meeting = await fetchMeetingByCalendarEvent(calendarEvent.id);
    expect(meeting.organizationId).toBeFalsy();
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

    const calendarEvent = await insertTestCalendarEvent(`For Locking: ${testName()}`);
    await replacePeopleOnCalendarEvent(calendarEvent.id, attendeeArray);

    await setOrganizationInternalMeetingsOnly(lockedOrganization1.id);
    await setOrganizationInternalMeetingsOnly(lockedOrganization2.id);

    const meeting = await fetchMeetingByCalendarEvent(calendarEvent.id);
    expect(meeting.organizationId).toBe(BlockingOrganizationId);
  });
});
