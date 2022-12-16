import {setOrganizationInternalMeetingsOnly} from '../data/people/set-organization-internal-meetings-only';

const runProcess = async () => {
  console.log('Beginning Org Locking');

  const organizationId = process.argv[2];

  if (!organizationId) throw new Error('Organization Id not provided');
  console.log(`Locking Organization: ${organizationId}`);

  await setOrganizationInternalMeetingsOnly(organizationId);

  process.exit();
};

runProcess();
