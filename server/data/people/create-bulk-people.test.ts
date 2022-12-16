import {createBulkPeopleFromAttendees} from './create-bulk-people';
import {v4 as uuid} from 'uuid';
import {Attendee} from '../../server-core/server-types';
import {fetchPeopleByEmailAddresses} from './fetch-people';
import {insertTestPerson, testName} from '../../testing/generate-test-data';
import {fetchPersonById} from './fetch-person';

const personId1 = uuid();
const emailAddress1 = `${personId1}@test.miter.co`;
const emailAddressId1 = uuid();
const displayName1 = 'Winchester Pratt';
const personId2 = uuid();
const emailAddress2 = `${personId2}@test.miter.co`;
const emailAddressId2 = uuid();
const displayName2 = 'Carla Rodriguez';
const domainId = '9d27ef71-6247-4f11-b015-3eca541e5bbf';
const organizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';

const attendeeArray: Attendee[] = [
  {
    id: personId1,
    serviceId: personId1,
    displayName: displayName1,
    emailAddressId: emailAddressId1,
    email: emailAddress1,
    domainId,
    optional: false,
    responseStatus: 'Accepted',
    organizationId,
  },
  {
    id: personId2,
    serviceId: personId2,
    displayName: displayName2,
    emailAddressId: emailAddressId2,
    email: emailAddress2,
    optional: false,
    responseStatus: 'Accepted',
    domainId,
    organizationId,
  },
];

describe('createBulkPeopleFromAttenddees', () => {
  it('should take an array in the appropriate format from createBulkCalendarEvents and create the appropriate people', async () => {
    const addedAttendees = await createBulkPeopleFromAttendees(attendeeArray);

    expect(addedAttendees?.length).toBe(2);
    const person1 = (await fetchPeopleByEmailAddresses([emailAddress1]))[0];
    expect(person1?.displayName).toBe(displayName1);
    expect(person1?.organizationId).toBe(organizationId);
  });
  it('should not overwrite the display name of an existing person if no display name is provided', async () => {
    const person = await insertTestPerson(testName(), 'test.co');

    const attendeeArray: Attendee[] = [
      {
        ...person,
        optional: false,
        responseStatus: 'Accepted',
        displayName: null,
      },
    ];
    await createBulkPeopleFromAttendees(attendeeArray);
    const updatePerson = await fetchPersonById(person.id);
    expect(updatePerson?.displayName).toBeTruthy();
  });
});
