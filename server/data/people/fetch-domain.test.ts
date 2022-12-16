import {fetchDomainByName} from './fetch-domain';

describe('fetchDomain', () => {
  const invalidDomain = 'invalid.not';
  const validDomain = 'miter.co';
  const validId = 'a0e2d844-c969-4857-b024-81d789ebb596';
  it('should return null when an invalid domain is queried', async () => {
    const domain = await fetchDomainByName(invalidDomain);
    expect(domain).toBeNull();
  });
  it('should return a domain when a valid domain is queried', async () => {
    const domain = await fetchDomainByName(validDomain);
    expect(domain?.id).toBe(validId);
  });
});
