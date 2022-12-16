import {createOrganization} from '../data/people/create-organization';

const runProcess = async () => {
  console.log('Beginning Org Creation');

  const organizationName = process.argv[2];
  const domainNames = process.argv.slice(3);

  if (!organizationName) throw new Error('Organization Name not provided');
  if (domainNames.length === 0) throw new Error('Domain Names not provided');

  console.log(`Creating Organization: ${organizationName}`);
  console.log(`Domains for Registration: ${domainNames}`);

  await createOrganization(organizationName, domainNames);

  process.exit();
};

runProcess();
