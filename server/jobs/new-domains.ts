import {createDomains} from '../data/people/create-domains';

const runProcess = async () => {
  console.log('Beginning Domain Creation');

  const domainNames = process.argv.slice(2);

  if (domainNames.length === 0) throw new Error('Domain Names not provided');

  console.log(`Creating Domains: ${domainNames}`);

  await createDomains(domainNames);

  process.exit();
};

runProcess();
