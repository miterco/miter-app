import {
  BatchInputSimplePublicObjectBatchInput,
  CollectionResponseWithTotalSimplePublicObjectForwardPaging,
  Filter,
  PublicObjectSearchRequest,
} from '@hubspot/api-client/lib/codegen/crm/companies/api';
import {IncomingMessage} from 'http';
import {getSuffixFromLinkedinCompanyUrl} from 'miter-common/CommonUtil';
import {createOrganization} from '../data/people/create-organization';
import {getPrismaClient} from '../data/prisma-client';
import {getHubspotClient} from './hubspot-client';

/*
 * Hubspot automatically creates one company object per domain even though it has all the info about that org (grrr)
 * Each Company will have Hubspot ID, Name, and Domain, but potentially not LinkedIn Company Page URL
 * So, our process is:
 * Pull a list of companies without Miter Ids from Hubspot
 * List may contain duplicate Names / LinkedIn Company Page URLs within itself, so check that first
 * List may contain duplicates Names / LinkedIn Cmopany Page URLs relative to our DB, so check that next
 * Create organizations for anything we're sure isn't a dupe
 * Update HubSpot with the new Miter ID for any processed companies
 * Log out potential dupes for manual checking and processing (TODO: somehow automate / make better)
 */

const hubspotChunkSize = 10; // Max allowed by Hubspot for updates

export type HsCompanyUpdateData = {
  id: string;
  properties: {
    miter_id: string;
  };
};

export type HsCompanyRecord = {
  hubspotId: string;
  name: string;
  domain: string;
  linkedinCompanyPageSuffix: string | null;
  isPotentialDupe: boolean;
};

type InterimDedupingResult = {
  hsCompanies: HsCompanyRecord[];
  prismaInputNames: string[];
  prismaInputDomains: string[];
  prismaInputLinkedinCompanyUrlSuffixes: string[];
};

/*
 * Validates Hubspot result and checks for dupes within result itself (an expected case)
 * Preps data structures for checking against dupes in existing database (also an expected case)
 */

export const validateAndParseHubspotCompanies = (results: any[]): InterimDedupingResult => {
  const prismaInputNames: string[] = [];
  const prismaInputDomains: string[] = [];
  const prismaInputLinkedinCompanyUrlSuffixes: string[] = [];
  const hsCompanies: HsCompanyRecord[] = [];

  results.forEach(row => {
    if (!row.properties?.hs_object_id || !row.properties?.name || !row.properties?.domain) {
      console.error(`Malformed HS Company Record, Missing Data: + ${row.properties}`);
      return;
    }
    if (row.properties.domain !== row.properties.domain.toLowerCase()) {
      console.error(`${row.properties.domain} ${row.properties.domain.toLowerCase()}`);
      console.error(`Malformed HS Company Record, Upper case domain: ${row.properties.domain}`);
      return;
    }

    let suffix: string | null = null;
    const {hs_object_id, name, domain, linkedin_company_page} = row.properties;
    const lowerCaseName = name.toLowerCase();

    try {
      suffix = getSuffixFromLinkedinCompanyUrl(linkedin_company_page);
    } catch {
      console.error(`Malformed LinkedIn Company Page URL: ${row.properties.linkedin_company_page}`);
      return;
    }

    const isPotentialDupe =
      (suffix && prismaInputLinkedinCompanyUrlSuffixes.includes(suffix)) ||
      prismaInputNames.includes(lowerCaseName) ||
      prismaInputDomains.includes(domain);

    // Note that prisma can handle duplicate input for "in:" clauses so we can just accumulate everything
    prismaInputNames.push(lowerCaseName);
    prismaInputDomains.push(domain);
    if (suffix) prismaInputLinkedinCompanyUrlSuffixes.push(suffix);

    hsCompanies.push({hubspotId: hs_object_id, name, domain, linkedinCompanyPageSuffix: suffix, isPotentialDupe});
  });

  return {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes};
};

// Takes the output of validateAndParseHubspotCompanies and checks for potential dupes against database
export const databaseDeDupe = async (input: InterimDedupingResult): Promise<HsCompanyRecord[]> => {
  const prisma = getPrismaClient();
  const {hsCompanies, prismaInputNames, prismaInputDomains, prismaInputLinkedinCompanyUrlSuffixes} = input;

  const potentialDupes = await prisma.organization.findMany({
    where: {
      OR: [
        {
          name: {
            in: prismaInputNames,
            mode: 'insensitive',
          },
        },
        {
          linkedinCompanyUrlSuffix: {
            in: prismaInputLinkedinCompanyUrlSuffixes,
          },
        },
        {
          domain: {
            some: {
              name: {
                in: prismaInputDomains,
              },
            },
          },
        },
      ],
    },
    include: {
      domain: {
        where: {
          name: {
            in: prismaInputDomains,
          },
        },
      },
    },
  });

  const dupeNames: Set<string> = new Set();
  const dupeDomains: Set<string> = new Set();
  const dupeSuffixes: Set<string> = new Set();

  potentialDupes.forEach(orgRow => {
    dupeNames.add(orgRow.name.toLowerCase());
    if (orgRow.linkedinCompanyUrlSuffix) dupeSuffixes.add(orgRow.linkedinCompanyUrlSuffix);
    orgRow.domain.forEach(domainRow => {
      dupeDomains.add(domainRow.name);
    });
  });

  for (let i = 0; i < hsCompanies.length; i++) {
    const {name, domain, linkedinCompanyPageSuffix: linkedInCompanyPageSuffix} = hsCompanies[i];
    if (
      dupeNames.has(name.toLowerCase()) ||
      dupeDomains.has(domain) ||
      (linkedInCompanyPageSuffix && dupeSuffixes.has(linkedInCompanyPageSuffix))
    ) {
      hsCompanies[i].isPotentialDupe = true;
    }
  }
  return hsCompanies;
};

export const syncNewHubspotCompanies = async (): Promise<HsCompanyUpdateData[]> => {
  const hubspot = await getHubspotClient();

  const fetchApiInput: PublicObjectSearchRequest = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'miter_id',
            operator: Filter.OperatorEnum.NotHasProperty,
          },
        ],
      },
    ],
    sorts: [],
    properties: ['hs_object_id', 'name', 'domain', 'linkedin_company_page'],
    limit: 100, // Note that this is the maximum alloved by HS
    after: 0,
  };

  let hsFetchResponse: {
    response: IncomingMessage;
    body: CollectionResponseWithTotalSimplePublicObjectForwardPaging;
  };

  try {
    hsFetchResponse = await hubspot.crm.companies.searchApi.doSearch(fetchApiInput);
  } catch (e: any) {
    throw new Error(`HS API Error: ${e?.response?.body?.message}`); // Real error info from HS only lives here
  }

  if (!hsFetchResponse || hsFetchResponse.body.results.length === 0) return [];

  const hsCompanies = await databaseDeDupe(validateAndParseHubspotCompanies(hsFetchResponse.body.results));
  const hsUpdates: HsCompanyUpdateData[] = [];

  for (let i = 0; i < hsCompanies.length; i++) {
    const {name, domain, hubspotId, linkedinCompanyPageSuffix, isPotentialDupe} = hsCompanies[i];

    if (isPotentialDupe) {
      console.log(`Company ${name} | Hubspot ID: ${hubspotId} requires manual review as potential duplicate`);
    } else {
      const organization = await createOrganization(name, [domain], linkedinCompanyPageSuffix, hubspotId);
      hsUpdates.push({id: hubspotId, properties: {miter_id: organization.id}});
    }
  }

  try {
    for (let i = 0; i < hsUpdates.length; i += hubspotChunkSize) {
      const apiInput: BatchInputSimplePublicObjectBatchInput = {
        inputs: hsUpdates.slice(i, i + hubspotChunkSize),
      };
      const _hsResponse = await hubspot.crm.companies.batchApi.update(apiInput);
    }
  } catch (e: any) {
    throw new Error(`HS API Error: ${e?.response?.body?.message}`); // Real error info from HS only lives here
  }

  return hsUpdates;
};
