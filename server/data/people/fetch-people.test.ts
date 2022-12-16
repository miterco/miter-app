import {uuid} from 'miter-common/CommonUtil';
import {Attendee, UserRecord} from '../../server-core/server-types';
import {
  insertBulkTestCalendarEvents,
  insertTestMeeting,
  insertTestPerson,
  insertTestUser,
} from '../../testing/generate-test-data';
import {fetchPeopleByEmailAddresses, fetchNonUsersFromAddressBook, fetchNonUsersFromMeeting} from './fetch-people';

describe('fetchPeopleByEmailAddress', () => {
  it('should fetch the person instance corresponding to the given email address', async () => {
    const emails = ['sampleemailw@test.miter.co'];

    const people = await fetchPeopleByEmailAddresses(emails);
    const displayName = 'Winchester Pratt';

    expect(people).toHaveLength(1);
    expect(people[0].displayName).toBe(displayName);
    expect(people[0].email).toBe('sampleemailw@test.miter.co');
  });

  it('should be able to take several email addresses', async () => {
    const emails = ['sampleemailw@test.miter.co', 'sampleemailc@test.miter.co'];

    const people = await fetchPeopleByEmailAddresses(emails);
    const displayName = 'Carla Rodriguez';

    expect(people).toHaveLength(2);
    expect(people[0].displayName).toBe(displayName);

    // Important that we send back only the email address with the person that was first submitted
    expect(people[0].email).toBe('sampleemailc@test.miter.co');
  });

  it('should still return some records when some of the emails do not have a corresponding db record', async () => {
    const emails = ['sampleemailw@test.miter.co', 'sampleemailc@test.miter.co', 'notindb@test.miter.co'];

    const people = await fetchPeopleByEmailAddresses(emails);
    const displayName = 'Winchester Pratt';

    expect(people).toHaveLength(2);
    expect(people[1].displayName).toBe(displayName);
  });
});

describe('fetchNonUsersFromAddressBook', () => {
  const TimeWindowStart = new Date('2022-05-10 14:00');
  const TimeWindowEnd = new Date('2022-05-24 23:00');
  const DateInTimeWindow = new Date('2022-05-15 10:00');
  const DateBeforeTimeWindow = new Date('2022-04-04 5:00');
  const DateAfterTimeWindow = new Date('2022-07-05 19:00');

  const attendeesOutsideTimeWindow: Attendee[] = [
    {
      id: uuid(),
      displayName: 'Not in address book - Outside time window - 1',
      email: 'fetchNonUserFromMeetingGuest1@test.com',
      emailAddressId: uuid(),
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: uuid(),
      displayName: 'Not in address book - Outside time window - 2',
      email: 'fetchPeopleMeetingWithUser2@test.com',
      emailAddressId: uuid(),
      optional: false,
      responseStatus: 'Accepted',
    },
  ];
  const attendeesInTimeWindow: Attendee[] = [
    {
      id: uuid(),
      displayName: 'Should be in address book - In time window - 1',
      email: 'fetchPeopleMeetingWithUser3@test.com',
      emailAddressId: uuid(),
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: uuid(),
      displayName: 'Should be in address book - In time window - 2',
      email: 'fetchPeopleMeetingWithUser4@test.com',
      emailAddressId: uuid(),
      optional: false,
      responseStatus: 'Accepted',
    },
    {
      id: uuid(),
      displayName: 'Should be in address book - In time window - 3',
      email: 'fetchPeopleMeetingWithUser5@test.com',
      emailAddressId: uuid(),
      optional: false,
      responseStatus: 'Accepted',
    },
  ];
  const attendeesWithUsers: Attendee[] = [];

  let user: UserRecord;

  beforeAll(async () => {
    // Create the main user for whom we'll be requesting the address book.
    user = await insertTestUser('fetchNonUsersFromAddressBook');

    // Create registered users attending the calendar events.
    const userInTimeWindow = await insertTestUser(`fetchNonUsersFromAddressBook - User in time window`);
    attendeesWithUsers.push(
      {
        id: user.personId,
        emailAddressId: uuid(),
        displayName: 'Address Book Owner',
        email: user.loginEmail,
        optional: false,
        responseStatus: 'Accepted',
      },
      {
        id: userInTimeWindow.personId,
        emailAddressId: uuid(),
        displayName: 'Not in address book - Has user',
        email: userInTimeWindow.loginEmail,
        optional: false,
        responseStatus: 'Accepted',
      }
    );

    // Create events in the time window.
    await insertBulkTestCalendarEvents('fetchNonUsersFromAddressBook - Event in time window - 1', 0, DateInTimeWindow, [
      ...attendeesWithUsers,
      attendeesInTimeWindow[0],
    ]);
    await insertBulkTestCalendarEvents('fetchNonUsersFromAddressBook - Event in time window - 2', 0, DateInTimeWindow, [
      ...attendeesWithUsers,
      attendeesInTimeWindow[1],
      attendeesInTimeWindow[2],
    ]);
    await insertBulkTestCalendarEvents('fetchNonUsersFromAddressBook - Event in time window - 3', 0, DateInTimeWindow, [
      ...attendeesInTimeWindow,
      ...attendeesWithUsers,
    ]);

    // Create events outside time window.
    await insertBulkTestCalendarEvents(
      'fetchNonUsersFromAddressBook - Event outside time window - 1',
      0,
      DateBeforeTimeWindow,
      [...attendeesWithUsers, ...attendeesOutsideTimeWindow]
    );
    await insertBulkTestCalendarEvents(
      'fetchNonUsersFromAddressBook - Event outside time window - 2',
      0,
      DateAfterTimeWindow,
      [...attendeesWithUsers, ...attendeesOutsideTimeWindow]
    );
  });

  it('should fail when an invalid person id is provided', async () => {
    await expect(fetchNonUsersFromAddressBook('invalid_person_id')).rejects.toThrow();
  });

  it('should retrieve the people that is meeting with the given user in the specified time window', async () => {
    const fetchedPeople = await fetchNonUsersFromAddressBook(user.id, TimeWindowStart, TimeWindowEnd);
    const fetchedPeopleEmails = fetchedPeople.map(person => person.email);

    attendeesInTimeWindow.forEach(({email}) => expect(fetchedPeopleEmails).toContain(email));
  });

  it('should not retrieve people that the user is meeting with outside the time window', async () => {
    const fetchedPeople = await fetchNonUsersFromAddressBook(user.id, TimeWindowStart, TimeWindowEnd);
    const fetchedPeopleEmails = fetchedPeople.map(person => person.email);

    attendeesOutsideTimeWindow.forEach(({email}) => expect(fetchedPeopleEmails).not.toContain(email));
  });

  it('should not include the person corresponding to the user for which the data was requested', async () => {
    const fetchedPeople = await fetchNonUsersFromAddressBook(user.id, TimeWindowStart, TimeWindowEnd);
    const fetchedPeopleEmails = fetchedPeople.map(person => person.email);

    attendeesWithUsers.forEach(() => expect(fetchedPeopleEmails).not.toContain(user.personId));
  });

  it('should not retrieve people that are registered users', async () => {
    const fetchedPeople = await fetchNonUsersFromAddressBook(user.id, TimeWindowStart, TimeWindowEnd);
    const fetchedPeopleEmails = fetchedPeople.map(person => person.email);

    attendeesWithUsers.forEach(({email}) => expect(fetchedPeopleEmails).not.toContain(email));
  });
});

describe('fetchNonUsersFromMeeting', () => {
  it('should return all non-registered people in the specified meeting', async () => {
    const guests = [
      {
        id: uuid(),
        displayName: 'Guest 1',
        email: 'fetchNonUserFromMeetingGuest1@test.com',
        emailAddressId: uuid(),
        optional: false,
        responseStatus: 'Accepted',
      },
      {
        id: uuid(),
        displayName: 'Guest 2',
        email: 'fetchNonUsersFromMeetingGuest2@test.com',
        emailAddressId: uuid(),
        optional: false,
        responseStatus: 'Accepted',
      },
    ];
    const [event] = await insertBulkTestCalendarEvents('fetchNonUsersFromMeeting - Event', 0, new Date(), guests);

    const nonUsersInMeeting = await fetchNonUsersFromMeeting(event.meetingId);
    const nonUserEmails = nonUsersInMeeting.map(({email}) => email);

    for (const guest of guests) expect(nonUserEmails).toContain(guest.email);
  });

  it('should not include registered users in the meeting in the return value', async () => {
    const user = await insertTestUser('fetchNonUsersFromMeeting - Registered User');
    const [event] = await insertBulkTestCalendarEvents('fetchNonUsersFromMeeting - Event', 0, new Date(), [
      {
        id: user.personId,
        emailAddressId: uuid(),
        displayName: 'Registered User',
        email: user.loginEmail,
        optional: false,
        responseStatus: 'Accepted',
      },
    ]);

    const nonUsersInMeeting = await fetchNonUsersFromMeeting(event.meetingId);
    const nonUserEmails = nonUsersInMeeting.map(({email}) => email);
    expect(nonUserEmails).not.toContain(user.loginEmail);
  });

  it('should only include non-users in a meeting with users and non-user invitees', async () => {
    const user = await insertTestUser('fetchNonUsersFromMeeting - Registered User');
    const guests = [
      {
        id: uuid(),
        displayName: 'Guest 1',
        email: 'fetchNonUserFromMeetingGuest3@test.com',
        emailAddressId: uuid(),
        optional: false,
        responseStatus: 'Accepted',
      },
      {
        id: uuid(),
        displayName: 'Guest 2',
        email: 'fetchNonUsersFromMeetingGuest4@test.com',
        emailAddressId: uuid(),
        optional: false,
        responseStatus: 'Accepted',
      },
    ];
    const [event] = await insertBulkTestCalendarEvents('fetchNonUsersFromMeeting - Event', 0, new Date(), [
      {
        id: user.personId,
        emailAddressId: uuid(),
        displayName: 'Registered User',
        email: user.loginEmail,
        optional: false,
        responseStatus: 'Accepted',
      },
      ...guests,
    ]);

    const nonUsersInMeeting = await fetchNonUsersFromMeeting(event.meetingId);
    const nonUserEmails = nonUsersInMeeting.map(({email}) => email);
    expect(nonUserEmails).not.toContain(user.loginEmail);
    for (const guest of guests) expect(nonUserEmails).toContain(guest.email);
  });
});
