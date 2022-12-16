import {fetchCalendarEventPeople} from '../data/people/fetch-calendar-event-people';
import {BlockingOrganizationId} from '../data/people/fetch-organization';
import {insertTestDataForLocking} from './generate-test-data';

describe('insertTestDataForLocking', () => {
  it('should create 2 locked people and 2 unlocked people (only 1 with org) with corresponding users', async () => {
    const {
      lockedPerson,
      lockedUser,
      secondLockedPerson,
      secondLockedUser,
      unlockedPerson,
      unlockedUser,
      secondUnlockedPerson,
      secondUnlockedUser,
      lockedOrganization,
      secondLockedOrganization,
      unlockedOrganization,
    } = await insertTestDataForLocking();
    expect(lockedPerson.organizationId).toBe(lockedOrganization.id);
    expect(secondLockedPerson.organizationId).toBe(secondLockedOrganization.id);
    expect(unlockedPerson.organizationId).toBe(unlockedOrganization.id);
    expect(secondUnlockedPerson.organizationId).toBeFalsy();

    expect(lockedUser.personId).toBe(lockedPerson.id);
    expect(secondLockedUser.personId).toBe(secondLockedPerson.id);
    expect(unlockedUser.personId).toBe(unlockedPerson.id);
    expect(secondUnlockedUser.personId).toBe(secondUnlockedPerson.id);

    expect(lockedOrganization.isLocked).toBeTruthy();
    expect(secondLockedOrganization.isLocked).toBeTruthy();
    expect(unlockedOrganization.isLocked).toBeFalsy();
  });

  it('should create a locked token, meeting & calendar event containing 1 locked and 1 unlocked individual', async () => {
    const {lockedMeetingToken, lockedMeeting, lockedCalendarEvent, lockedPerson, unlockedPerson} =
      await insertTestDataForLocking();
    expect(lockedMeetingToken.meetingId).toBe(lockedMeeting.id);
    expect(lockedMeeting.organizationId).toBeTruthy();
    expect(lockedCalendarEvent.meetingId).toBe(lockedMeeting.id);
    const invitees = await fetchCalendarEventPeople(lockedCalendarEvent.id);
    const inviteeIds = invitees.map(invitee => invitee.id);
    expect(invitees).toHaveLength(2);
    expect(inviteeIds).toContainEqual(lockedPerson.id);
    expect(inviteeIds).toContainEqual(unlockedPerson.id);
  });

  it('should create an unlocked token, meeting & calendar event containing only 1 unlocked individual', async () => {
    const {unlockedMeeting, unlockedMeetingToken, unlockedCalendarEvent, unlockedPerson, secondUnlockedPerson} =
      await insertTestDataForLocking();
    expect(unlockedMeetingToken.meetingId).toBe(unlockedMeeting.id);
    expect(unlockedMeeting.organizationId).toBeFalsy();
    expect(unlockedCalendarEvent.meetingId).toBe(unlockedMeeting.id);
    const invitees = await fetchCalendarEventPeople(unlockedCalendarEvent.id);
    const inviteeIds = invitees.map(invitee => invitee.id);
    expect(invitees).toHaveLength(2);
    expect(inviteeIds).toContainEqual(unlockedPerson.id);
    expect(inviteeIds).toContainEqual(secondUnlockedPerson.id);
  });

  it('should create a blocked token, meeting & calendar event containing 2 locked individuals', async () => {
    const {blockedMeeting, blockedMeetingToken, blockedCalendarEvent, lockedPerson, secondLockedPerson} =
      await insertTestDataForLocking();
    expect(blockedMeetingToken.meetingId).toBe(blockedMeeting.id);
    expect(blockedMeeting.organizationId).toBeTruthy();
    expect(blockedCalendarEvent.meetingId).toBe(blockedMeeting.id);
    const invitees = await fetchCalendarEventPeople(blockedCalendarEvent.id);
    const inviteeIds = invitees.map(invitee => invitee.id);
    expect(invitees).toHaveLength(2);
    expect(inviteeIds).toContainEqual(lockedPerson.id);
    expect(inviteeIds).toContainEqual(secondLockedPerson.id);
  });

  it('should set a Blocked Meeting Organization ID to the blockingOrganizationId', async () => {
    const {blockedMeeting} = await insertTestDataForLocking();

    expect(blockedMeeting.organizationId).toBe(BlockingOrganizationId);
  });
});
