import {fetchOrganizationAndDomainFromDomainNames} from './fetch-organization-domain-from-domain-name';

const organizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';

describe('fetchOrganizationAndDomainFromDomainNames', () => {
  it('should produce a list of domain names, domain ids, and organization ids for a set of domain names', async () => {
    const domainChart = await fetchOrganizationAndDomainFromDomainNames(['miter.co', 'miter.xyz']);

    expect(domainChart).toContainEqual({
      name: 'miter.co',
      id: 'a0e2d844-c969-4857-b024-81d789ebb596',
      organizationId,
    });
    expect(domainChart).toContainEqual({
      name: 'miter.xyz',
      id: '9d27ef71-6247-4f11-b015-3eca541e5bbf',
      organizationId,
    });
  });
});
