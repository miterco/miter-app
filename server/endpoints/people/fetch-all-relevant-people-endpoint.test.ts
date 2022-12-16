import {
  insertMultipleTestUsers,
  insertTestPeopleFromAttendees,
  insertTestMeetingAndCalendarEvent,
  testName,
  insertTestOrganizationAndDomain,
  insertTestDomain,
  insertTestUser,
  insertTestCalendarEvent,
} from '../../testing/generate-test-data';
import {EmailRecipientWithId, RelevantPeopleResponse} from 'miter-common/SharedTypes';
import {addMeetingAttendee} from '../../data/people/add-meeting-attendee';
import {fetchAllRelevantPeopleEndpoint} from './fetch-all-relevant-people-endpoint';
import {v4 as uuid} from 'uuid';
import {
  convertFullPersonRecordToRecipientWithId,
  convertUserRecordToRecipientWithId,
} from '../../server-core/server-util';
import {fetchCalendarEventByMeetingId} from '../../data/meetings-events/fetch-calendar-event';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';
import {fetchPeopleByEmailAddresses} from '../../data/people/fetch-people';
import {Attendee} from '../../server-core/server-types';
import {setOrganizationInternalMeetingsOnly} from '../../data/people/set-organization-internal-meetings-only';
import {fetchMeetingByCalendarEvent} from '../../data/meetings-events/fetch-meeting';
import {replacePeopleOnCalendarEvent} from '../../data/people/replace-people-on-calendar-events';

const testFactory = (eventPeopleCount: number, meetingPeopleCount: number, shouldThrow: boolean = false) => {
  return async () => {
    const server = mockSocketServer();

    // Need a meeting to edit, and a calendarEvent on which to base it
    const {meeting, calendarEvent} = await insertTestMeetingAndCalendarEvent(testName());
    if (!calendarEvent?.id) throw 'This error here for Typescript purposes';

    // Add some event people
    const eventPeople = await insertTestPeopleFromAttendees(testName(), eventPeopleCount);
    if (eventPeople.length) await replacePeopleOnCalendarEvent(calendarEvent.id, eventPeople);

    // Add some meeting people
    const users = await insertMultipleTestUsers(testName(), meetingPeopleCount);
    for (let i = 0; i < users.length; i++) await addMeetingAttendee(meeting.id, users[i].id);

    (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
    const reqId = uuid();
    const client = mockWebSocket();
    const promise = fetchAllRelevantPeopleEndpoint(server, client, {}, reqId);

    if (shouldThrow) {
      await expect(promise).rejects.toThrow();
      expect(server.send).toHaveBeenCalledTimes(0);
    } else {
      await promise;

      expect(server.send).toHaveBeenCalledTimes(1);

      // Not sure how useful this comparison will be...mostly we're just replicating endpoint logic
      const expectedResult: EmailRecipientWithId[] = [];
      eventPeople.forEach(person => expectedResult.push(convertFullPersonRecordToRecipientWithId(person)));
      users.forEach(user => expectedResult.push(convertUserRecordToRecipientWithId(user))); // Not de-duping because all the emails should be using UUIDs.
      expectedResult.sort((a, b) => (a.email < b.email ? -1 : 1));

      const expectedResponse: RelevantPeopleResponse = {people: expectedResult};

      expect(server.send).toHaveBeenCalledWith(client, 'AllRelevantPeople', expectedResponse);
    }
  };
};

test('Fetch relevant people - invitees only', testFactory(3, 0));
test('Fetch relevant people - attendees only', testFactory(0, 2));
test('Fetch relevant people - one attendee', testFactory(0, 1));
test('Fetch relevant people - attendees and invitees', testFactory(3, 5));
test('Fetch relevant people - nobody here', testFactory(0, 0));

test('Fetch relevant people - locked meetings should only return people from locked org', async () => {
  const server = mockSocketServer();

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

  (server.getExistingChannel as jest.Mock).mockReturnValueOnce(meeting.id);
  const reqId = uuid();
  const client = mockWebSocket();
  await fetchAllRelevantPeopleEndpoint(server, client, {}, reqId);

  expect(server.send).toHaveBeenCalledTimes(1);

  // TODO (and adding a backlog task): Before PH launch we updated this and it's a tasd messy. The endpoint here iterates
  // over attendees (users), then invitees (people), and collapses them down to a single array of recipients. Previously,
  // those recipients all just had person IDs, which was causing problems because sometimes we need a userId to get a
  // valid avatar on the client. So we augmented the endpoint so the attendee loop adds the userId. Yay, that helps! But
  // this test works off invitees, which didn't matter when the data structure between the two loops was the same. We
  // were using convertUserRecordToRecipientWithId() off the userToBeLocked UserRecord and getting the same data structure
  // we'd have gotten from convertFullPersonRecordToRecipientWithId(). But with the addition of userId() that's no longer
  // true. And it's the eleventh hour. And this feels like a safe change. So we're just keeping the test as it was,
  // except stripping the userId back off. We should really fix this. But in the meantime, we're still checking that we're
  // getting the locked user and not the unlocked one.
  const {userId, ...sortOfAnEmailRecipient} = convertUserRecordToRecipientWithId(userToBeLocked);
  const expectedResult: EmailRecipientWithId[] = [sortOfAnEmailRecipient];

  const expectedResponse: RelevantPeopleResponse = {people: expectedResult};

  expect(server.send).toHaveBeenCalledWith(client, 'AllRelevantPeople', expectedResponse);
});
