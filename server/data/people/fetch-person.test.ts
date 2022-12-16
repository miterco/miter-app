import {uuid} from 'miter-common/CommonUtil';
import {fetchPersonByEmail, fetchPersonById, fetchPersonByUserId} from './fetch-person';

const picture = 'https://lh3.googleusercontent.com/a-/12345';

describe('fetchPersonByEmail', () => {
  it('should return a person for a known email', async () => {
    const person = await fetchPersonByEmail('sampleemailw@test.miter.co');
    expect(person?.displayName).toBe('Winchester Pratt');
    expect(person?.picture).toBe(picture);
  });

  it('should return null for an email not in the DB', async () => {
    const person = await fetchPersonByEmail(`${uuid()}@test.miter.co`);
    expect(person).toBeFalsy();
  });
});

describe('fetchPersonById', () => {
  it('should return a person with a valid personId', async () => {
    const person = await fetchPersonById('c50b11ba-fa72-482c-94ee-ad4a73b6a118');
    expect(person?.displayName).toBe('Winchester Pratt');
    expect(person?.picture).toBe(picture);
  });
});

describe('fetchPersonbyUserId', () => {
  it('should return a person from a valid userId', async () => {
    const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
    const personId = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';

    const person = await fetchPersonByUserId(userId);
    expect(person?.id).toBe(personId);
  });
});
