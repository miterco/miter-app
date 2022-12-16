import {uuid} from 'miter-common/CommonUtil';
import {insertTestPerson, testName} from '../../testing/generate-test-data';
import {createDomains} from './create-domains';
import {fetchPersonByEmail} from './fetch-person';

describe('createDomains', () => {
  it('should not create a personal email domain', async () => {
    const domainNames = ['gmail.com'];
    const domains = await createDomains(domainNames);

    expect(domains).toHaveLength(0);
  });

  it('should create a corporate email domain', async () => {
    const domainNames = [`miter${uuid()}.co`];
    const domains = await createDomains(domainNames);

    expect(domains).toHaveLength(1);
    expect(domains[0].name).toBe(domainNames[0]);
  });

  it('should create multiple corporate email domains', async () => {
    const domainNames = [`miter${uuid()}.co`, `miter${uuid()}.co`];
    const domains = await createDomains(domainNames);
    const domainsNamesForChecking = domains.map(row => row.name);

    expect(domains).toHaveLength(2);
    expect(domainsNamesForChecking).toContain(domainNames[0]);
    expect(domainsNamesForChecking).toContain(domainNames[1]);
  });

  it('should update existing users with new domain', async () => {
    const domainNames = [`miter${uuid()}.co`];

    const person = await insertTestPerson(testName(), domainNames[0]);
    const domains = await createDomains(domainNames);
    expect(domains).toHaveLength(1);
    const personAfterDomainCreation = await fetchPersonByEmail(person.email);
    expect(personAfterDomainCreation?.emailAddress[0].domainId).toBe(domains[0].id);
  });
});
