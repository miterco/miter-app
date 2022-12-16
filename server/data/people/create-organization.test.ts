import {uuid} from 'miter-common/CommonUtil';
import {insertTestPerson, testName} from '../../testing/generate-test-data';
import {createOrganization} from './create-organization';
import {fetchDomainByName} from './fetch-domain';
import {fetchPersonById} from './fetch-person';

describe('createOrganization', () => {
  it('should take multiple domains and an org name, create the organization and update associated people to that organization', async () => {
    const organizationName = `${testName()}: ${uuid()} `;

    const domainNames = [`miter${uuid()}.co`, `miter${uuid()}.co`];
    const person0 = await insertTestPerson(testName(), domainNames[0]);
    const person1 = await insertTestPerson(testName(), domainNames[1]);

    const organization = await createOrganization(organizationName, domainNames);
    expect(organization.name).toBe(organizationName);

    const domainCheck0 = await fetchDomainByName(organization.domain[0].name);
    expect(domainCheck0?.organizationId).toBe(organization.id);

    const domainCheck1 = await fetchDomainByName(organization.domain[1].name);
    expect(domainCheck1?.organizationId).toBe(organization.id);

    const personCheck0 = await fetchPersonById(person0.id);
    expect(personCheck0?.organizationId).toBe(organization.id);

    const personCheck1 = await fetchPersonById(person1.id);
    expect(personCheck1?.organizationId).toBe(organization.id);
  });
});
