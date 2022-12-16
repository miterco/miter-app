import {Organization} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';
import {addDomainsToOrganization} from './add-domains-to-organization';
import {createDomains} from './create-domains';
import {fetchOrganizationById} from './fetch-organization';

const prisma = getPrismaClient();

export const createOrganization = async (
  name: string,
  domainNames: string[],
  linkedinCompanyUrlSuffix?: string | null,
  hubspotId?: string
): Promise<Organization> => {
  const organization = await prisma.organization.create({
    data: {
      name,
      linkedinCompanyUrlSuffix,
      hubspotId,
    },
  });

  const domains = await createDomains(domainNames);
  const domainIds = domains.map(row => row.id);
  await addDomainsToOrganization(domainIds, organization.id);

  return await fetchOrganizationById(organization.id);
};
