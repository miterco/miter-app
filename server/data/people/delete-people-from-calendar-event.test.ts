import {createBulkPeopleFromAttendees} from './create-bulk-people';
import {v4 as uuid} from 'uuid';
import {fetchPersonByEmail, fetchPersonById} from './fetch-person';
import {replacePeopleOnCalendarEvent} from './replace-people-on-calendar-events';
import {fetchCalendarEventPeople} from './fetch-calendar-event-people';
import {deletePeopleFromCalendarEvent} from './delete-people-from-calendar-event';
import {Attendee} from '../../server-core/server-types';
import {insertTestCalendarEvent, testName} from '../../testing/generate-test-data';

test('deletePeopleFromMeeting', async () => {
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
  expect(person1a?.displayName).toBe(displayName1);

  await replacePeopleOnCalendarEvent(newCalendarEvent.id, addedAttendees);
  const calendarEventPeople = await fetchCalendarEventPeople(newCalendarEvent.id);
  expect(calendarEventPeople?.length).toBe(2);

  const deletedAttendees = await deletePeopleFromCalendarEvent([newCalendarEvent.id]);
  expect(deletedAttendees).toBe(2);
  const noAttendees = await fetchCalendarEventPeople(newCalendarEvent.id);
  expect(noAttendees?.length).toBe(0);

  const fetchOtherMeeting = await fetchCalendarEventPeople('eaa0e3b3-ca77-457c-9fa5-55d36c11191f');
  expect(fetchOtherMeeting?.length).toBe(3);
});
