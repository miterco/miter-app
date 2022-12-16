import {createPerson} from './create-person';
import {v4 as uuid} from 'uuid';
import {fetchPersonByEmail} from './fetch-person';

describe('createPerson', () => {
  it('should create a person with valid input', async () => {
    const id = uuid();
    const email = `${id}@test.miter.co`;
    const displayName = 'Winchester Pratt';

    const addedPerson = await createPerson({
      email,
      displayName,
    });

    expect(addedPerson?.displayName).toBe(displayName);
    const person = await fetchPersonByEmail(email);
    expect(person?.displayName).toBe(displayName);
  });

  it('should attach a person to the appropriate email domain and organization if those are registered', async () => {
    const id = uuid();
    const email = `${id}@test.miter.co`;
    const displayName = 'Winchester Pratt';
    const organizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';
    const domainId = 'a0e2d844-c969-4857-b024-81d789ebb596';

    const addedPerson = await createPerson({
      email,
      displayName,
    });

    expect(addedPerson.organizationId).toEqual(organizationId);
    expect(addedPerson.domainId).toEqual(domainId);
  });
});
