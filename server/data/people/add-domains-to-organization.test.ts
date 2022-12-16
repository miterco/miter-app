import {uuid} from 'miter-common/CommonUtil';
import {
  insertTestDomain,
  insertTestOrganizationAndDomain,
  insertTestPerson,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {addDomainsToOrganization} from './add-domains-to-organization';
import {createDomains} from './create-domains';
import {fetchDomainByName} from './fetch-domain';
import {fetchPersonById} from './fetch-person';
import {fetchUserByMiterId} from './fetch-user';

describe('addDomainsToOrganization', () => {
  it('should take multiple domains, add them to an organization, and update associated people to that organization', async () => {
    const organizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';

    const domainNames = [`miter${uuid()}.co`, `miter${uuid()}.co`];
    const person0 = await insertTestPerson(testName(), domainNames[0]);
    const person1 = await insertTestPerson(testName(), domainNames[1]);

    const domains = await createDomains(domainNames);
    expect(domains).toHaveLength(2);
    const domainIds = domains.map(row => row.id);

    await addDomainsToOrganization(domainIds, organizationId);

    const domainCheck0 = await fetchDomainByName(domains[0].name);
    expect(domainCheck0?.organizationId).toBe(organizationId);

    const domainCheck1 = await fetchDomainByName(domains[1].name);
    expect(domainCheck1?.organizationId).toBe(organizationId);

    const personCheck0 = await fetchPersonById(person0.id);
    expect(personCheck0?.organizationId).toBe(organizationId);

    const personCheck1 = await fetchPersonById(person1.id);
    expect(personCheck1?.organizationId).toBe(organizationId);
  });

  it('should add existing users to an organization', async () => {
    const {organization} = await insertTestOrganizationAndDomain(testName());
    const domain = await insertTestDomain();

    const user = await insertTestUser(testName(), {loginEmail: `${uuid()}@${domain.name}`});

    await addDomainsToOrganization([domain.id], organization.id);

    const updatedUser = await fetchUserByMiterId(user.id);
    expect(updatedUser?.organizationId).toBe(organization.id);
  });
});
