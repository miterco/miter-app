import {SimplePublicObjectInput} from '@hubspot/api-client/lib/codegen/crm/companies/api';
import {LinkedinCompanyUrlPrefix, uuid} from 'miter-common/CommonUtil';
import {fetchOrganizationById} from '../data/people/fetch-organization';
import {delay} from '../testing/generate-test-data';
import {getHubspotClient} from './hubspot-client';
import {
  databaseDeDupe,
  HsCompanyUpdateData,
  syncNewHubspotCompanies,
  validateAndParseHubspotCompanies,
} from './hubspot-company';

const miterHubspotId = '8375842974';

describe('validateAndParseHubspotCompanies', () => {
  it('for completely non-duplicated input rows: \
      should not set isPotentialDuplicate \
      should have a name, domain, and linkedIn Company URL Suffix for every input row', () => {
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'Unique 1', domain: 'domain1.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain1`,},},
      {properties: {hs_object_id: 2, name: 'Unique 2', domain: 'domain2.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain2`,},},
      {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'domain3.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain3`,},},
    ];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(3);
    // prettier-ignore
    expect(hsCompanies[0]).toEqual({hubspotId: 1, name: 'Unique 1', domain: 'domain1.com', linkedinCompanyPageSuffix: 'domain1', isPotentialDupe: false})
    // prettier-ignore
    expect(hsCompanies[1]).toEqual({hubspotId: 2, name: 'Unique 2', domain: 'domain2.com', linkedinCompanyPageSuffix: 'domain2', isPotentialDupe: false})
    // prettier-ignore
    expect(hsCompanies[2]).toEqual({hubspotId: 3, name: 'Unique 3', domain: 'domain3.com', linkedinCompanyPageSuffix: 'domain3', isPotentialDupe: false})

    expect(prismaInputNames).toHaveLength(3);
    expect(prismaInputNames).toContain('unique 1');
    expect(prismaInputNames).toContain('unique 2');
    expect(prismaInputNames).toContain('unique 3');
    expect(prismaInputDomains).toHaveLength(3);
    expect(prismaInputDomains).toContain('domain1.com');
    expect(prismaInputDomains).toContain('domain2.com');
    expect(prismaInputDomains).toContain('domain3.com');
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(3);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toContain('domain1');
    expect(prismaInputLinkedinCompanyUrlSuffixes).toContain('domain2');
    expect(prismaInputLinkedinCompanyUrlSuffixes).toContain('domain3');
  });

  it('should filter out rows without hs_object_id, name, or domain, BUT LinkedIn Company URL can be blank', () => {
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'Unique 1', domain: 'domain1.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain1`,},},
      {properties: {hs_object_id: 2, name: 'Unique 2', domain: 'domain2.com', linkedin_company_page: null,},},
      {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'domain3.com',},},
      {properties: {name: 'Unique 4', domain: 'domain4.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain4`,},},
      {properties: {hs_object_id: 5, domain: 'domain5.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain5`,},},
      {properties: {hs_object_id: 6, name: 'Unique 6', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain6`,},},
    ];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[1].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[2].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[0].hubspotId).toBe(1);
    expect(hsCompanies[1].hubspotId).toBe(2);
    expect(hsCompanies[2].hubspotId).toBe(3);
    expect(prismaInputNames).toHaveLength(3);
    expect(prismaInputDomains).toHaveLength(3);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(1);
  });

  it('should filter out rows with upper case letters in domain or LinkedIn Company Url', () => {
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'Unique 1', domain: 'DOMAIN.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain1`,},},
      {properties: {hs_object_id: 2, name: 'Unique 2', domain: 'domain2.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}DOMAIN2`,},},
      {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'domain3.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain3`,},},
    ];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(1);
    expect(hsCompanies[0].hubspotId).toBe(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(prismaInputNames).toHaveLength(1);
    expect(prismaInputDomains).toHaveLength(1);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(1);
  });

  it('should filter out rows with LinkedIn Company Urls that do not have the right prefix or have trailing /', () => {
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'Unique 1', domain: 'domain1.com', linkedin_company_page: `Not a URL`,},},
      {properties: {hs_object_id: 2, name: 'Unique 2', domain: 'domain2.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain2`,},},
      {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'domain3.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain3/`,},},
    ];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(1);
    expect(hsCompanies[0].hubspotId).toBe(2);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(prismaInputNames).toHaveLength(1);
    expect(prismaInputDomains).toHaveLength(1);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(1);
  });

  it('for duplicated names (case insensitive): \
      should set isPotentialDuplicate on 2nd duplicate row \
      should have a name, domain, and linkedIn Company URL Suffix for every input row', () => {
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'DUPLICATE', domain: 'domain1.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain1`,},},
      {properties: {hs_object_id: 2, name: 'duplicate', domain: 'domain2.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain2`,},},
      {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'domain3.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain3`,},},
    ];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[1].isPotentialDupe).toBeTruthy();
    expect(hsCompanies[2].isPotentialDupe).toBeFalsy();
    expect(prismaInputNames).toHaveLength(3);
    expect(prismaInputDomains).toHaveLength(3);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(3);
  });

  // Switching this one up a smidge so we don't get TOO copy-happy
  it('for duplicated domains: \
  should set isPotentialDuplicate on 2nd AND SUBSEQUENT duplicate row \
  should have a name, domain, and linkedIn Company URL Suffix for every input row', () => {
    // prettier-ignore
    const hsResults = [
  {properties: {hs_object_id: 1, name: 'Unique 1', domain: 'duplicate.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain1`,},},
  {properties: {hs_object_id: 2, name: 'Unique 2', domain: 'duplicate.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain2`,},},
  {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'duplicate.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain3`,},},
];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[1].isPotentialDupe).toBeTruthy();
    expect(hsCompanies[2].isPotentialDupe).toBeTruthy();
    expect(prismaInputNames).toHaveLength(3);
    expect(prismaInputDomains).toHaveLength(3);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(3);
  });

  it('for duplicated LinkedIn URLs: \
      should set isPotentialDuplicate on 2nd duplicate row \
      should have a name, domain, and linkedIn Company URL Suffix for every input row', () => {
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'Unique 1', domain: 'domain1.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}duplicate`,},},
      {properties: {hs_object_id: 2, name: 'Unique 2', domain: 'domain2.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}duplicate`,},},
      {properties: {hs_object_id: 3, name: 'Unique 3', domain: 'domain3.com', linkedin_company_page: `${LinkedinCompanyUrlPrefix}domain3`,},},
    ];
    const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} =
      validateAndParseHubspotCompanies(hsResults);

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[1].isPotentialDupe).toBeTruthy();
    expect(hsCompanies[2].isPotentialDupe).toBeFalsy();
    expect(prismaInputNames).toHaveLength(3);
    expect(prismaInputDomains).toHaveLength(3);
    expect(prismaInputLinkedinCompanyUrlSuffixes).toHaveLength(3);
  });
});

describe('databaseDeDupe', () => {
  it('should take in new values (from the output of validateAndParseHubspotCompanies) \
  and not mark any as duplicates \
  and not otherwise disturb the contents of hsCompanies', async () => {
    const uuid1 = uuid();
    const uuid2 = uuid();
    const uuid3 = uuid();
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: uuid1, domain: `${uuid1}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid1}`,},},
      {properties: {hs_object_id: 2, name: uuid2, domain: `${uuid2}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid2}`,},},
      {properties: {hs_object_id: 3, name: uuid3, domain: `${uuid3}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid3}`,},},
  ];
    const hsCompanies = await databaseDeDupe(validateAndParseHubspotCompanies(hsResults));

    expect(hsCompanies).toHaveLength(3);
    // prettier-ignore
    expect(hsCompanies[0]).toEqual({hubspotId: 1, name: uuid1, domain: `${uuid1}.com`, linkedinCompanyPageSuffix: uuid1, isPotentialDupe: false})
    // prettier-ignore
    expect(hsCompanies[1]).toEqual({hubspotId: 2, name: uuid2, domain: `${uuid2}.com`, linkedinCompanyPageSuffix: uuid2, isPotentialDupe: false})
    // prettier-ignore
    expect(hsCompanies[2]).toEqual({hubspotId: 3, name: uuid3, domain: `${uuid3}.com`, linkedinCompanyPageSuffix: uuid3, isPotentialDupe: false})
  });

  it('should set isPotentialDupe for a name (case insensitive) we know is in db', async () => {
    const uuid1 = uuid();
    const uuid2 = uuid();
    const uuid3 = uuid();
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: 'mitEr', domain: `${uuid1}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid1}`,},},
      {properties: {hs_object_id: 2, name: uuid2, domain: `${uuid2}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid2}`,},},
      {properties: {hs_object_id: 3, name: uuid3, domain: `${uuid3}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid3}`,},},
  ];
    const hsCompanies = await databaseDeDupe(validateAndParseHubspotCompanies(hsResults));

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeTruthy();
    expect(hsCompanies[1].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[2].isPotentialDupe).toBeFalsy();
  });

  it('should set isPotentialDupe for a domain we know is in db', async () => {
    const uuid1 = uuid();
    const uuid2 = uuid();
    const uuid3 = uuid();
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: uuid1, domain: `${uuid1}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid1}`,},},
      {properties: {hs_object_id: 2, name: uuid2, domain: `miter.co`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid2}`,},},
      {properties: {hs_object_id: 3, name: uuid3, domain: `${uuid3}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid3}`,},},
];
    const hsCompanies = await databaseDeDupe(validateAndParseHubspotCompanies(hsResults));

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[1].isPotentialDupe).toBeTruthy();
    expect(hsCompanies[2].isPotentialDupe).toBeFalsy();
  });

  it('should set isPotentialDupe for a LinkedIn Company URL Suffix we know is in db', async () => {
    const uuid1 = uuid();
    const uuid2 = uuid();
    const uuid3 = uuid();
    // prettier-ignore
    const hsResults = [
      {properties: {hs_object_id: 1, name: uuid1, domain: `${uuid1}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid1}`,},},
      {properties: {hs_object_id: 2, name: uuid2, domain: `${uuid2}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid2}`,},},
      {properties: {hs_object_id: 3, name: uuid3, domain: `${uuid3}.com`, linkedin_company_page: `${LinkedinCompanyUrlPrefix}miterco`,},},
];
    const hsCompanies = await databaseDeDupe(validateAndParseHubspotCompanies(hsResults));

    expect(hsCompanies).toHaveLength(3);
    expect(hsCompanies[0].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[1].isPotentialDupe).toBeFalsy();
    expect(hsCompanies[2].isPotentialDupe).toBeTruthy();
  });
});

describe('syncNewHubspotCompanies', () => {
  const uuid1 = uuid();
  const createApiInput: SimplePublicObjectInput = {
    properties: {
      name: uuid1,
      domain: `${uuid1}.com`,
      linkedin_company_page: `${LinkedinCompanyUrlPrefix}${uuid1}`,
    },
  };
  let result: HsCompanyUpdateData[];
  let hubspotId: string;
  beforeAll(async () => {
    const hubspot = await getHubspotClient();
    const hsResponse = await hubspot.crm.companies.basicApi.create(createApiInput);
    hubspotId = hsResponse.body.id;

    // Even though the company has been created there's a lag in HS making the new value available to query
    // Maybe due ot indexing? In any event, if you run syncNewHubspotCompanies too quickly, it will fail
    await delay(5000);
    result = await syncNewHubspotCompanies();
  });

  it('should fetch all companies in HubSpot without Miter IDs', () => {
    expect(result?.length).toBeGreaterThan(0);
  });

  it('should return appropriate Miter Ids and Hubspot Ids that are captured in DB and in HubSpot', async () => {
    const filteredResult = result.filter(row => row.id === hubspotId);
    expect(filteredResult).toHaveLength(1);
    const organizationId = filteredResult[0].properties.miter_id;
    const organization = await fetchOrganizationById(organizationId);
    expect(organization.hubspotId).toBe(hubspotId);
  });

  it('should not try to create duplicate ids', () => {
    const filteredResult = result.filter(row => row.id === miterHubspotId);
    expect(filteredResult).toHaveLength(0);
  });
});
