import {addDomainsToOrganization} from '../data/people/add-domains-to-organization';

const runProcess = async () => {
  console.log('Beginning Org/Domain Registration');

  const organizationId = process.argv[2];
  const domainIds = process.argv.slice(3);

  if (!organizationId) throw new Error('Organization Name not provided');
  if (domainIds.length === 0) throw new Error('Domain Names not provided');

  console.log(`Parent Organization: ${organizationId}`);
  console.log(`Domains for Registration: ${domainIds}`);

  await addDomainsToOrganization(domainIds, organizationId);

  process.exit();
};

runProcess();
