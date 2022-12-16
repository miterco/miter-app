import {uuid} from 'miter-common/CommonUtil';
import {insertTestOrganizationAndDomain} from '../../testing/generate-test-data';
import {fetchLockingOrganizationId, fetchOrganizationByDomain, fetchOrganizationById} from './fetch-organization';
import {setOrganizationInternalMeetingsOnly} from './set-organization-internal-meetings-only';

const invalidDomain = 'invalid.not';
const domainName1 = 'miter.co';
const domainName2 = 'miter.com';
const domainName3 = 'miter.xyz';
const organizationName = 'Miter';
const organizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';
const hubspotId = '8375842974';

describe('fetchOrganizationByDomain', () => {
  it('should return null when an existing domain is not provided', async () => {
    const organization = await fetchOrganizationByDomain(invalidDomain);
    expect(organization).toBeNull();
  });

  it('should return a valid organization when provided a valid domain', async () => {
    const organization = await fetchOrganizationByDomain(domainName1);
    expect(organization).toBeTruthy();
    expect(organization?.name).toBe(organizationName);
  });

  it('should return all valid domains with a valid organization', async () => {
    const organization = await fetchOrganizationByDomain(domainName1);
    const domains = organization?.domain.map(row => row.name);

    expect(domains).toBeTruthy();
    expect(domains).toContain(domainName1);
    expect(domains).toContain(domainName2);
    expect(domains).toContain(domainName3);
  });
});

test('should throw when an existing ID is not provided', async () => {
  const id = uuid();
  const promise = fetchOrganizationById(id);
  await expect(promise).rejects.toThrow();
});

describe('fetchOrganizationById', () => {
  it('should return a valid organization when a valid id is provided', async () => {
    const organization = await fetchOrganizationById(organizationId);
    expect(organization?.name).toBe(organizationName);
    expect(organization.hubspotId).toBe(hubspotId);
  });
});

describe('fetchLockingOrganizationId', () => {
  it('should return null when provided with null', async () => {
    expect(await fetchLockingOrganizationId(null)).toBeFalsy();
  });

  it('should return null when provided with undefined', async () => {
    expect(await fetchLockingOrganizationId(undefined)).toBeFalsy();
  });

  it('should throw an error when provided an ID not in DB', async () => {
    const promise = fetchLockingOrganizationId(uuid());
    await expect(promise).rejects.toThrow();
  });

  it('should return null when provided with an unlocked org id', async () => {
    const {organization} = await insertTestOrganizationAndDomain('fetchLockingOrganizationId');
    expect(await fetchLockingOrganizationId(organization.id)).toBeFalsy();
  });

  it('should return the org id when provided with an locked org id', async () => {
    const {organization} = await insertTestOrganizationAndDomain('fetchLockingOrganizationId');
    await setOrganizationInternalMeetingsOnly(organization.id);
    expect(await fetchLockingOrganizationId(organization.id)).toBe(organization.id);
  });
});
