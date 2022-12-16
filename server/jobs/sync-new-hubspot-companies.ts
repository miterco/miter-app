import {updateOrganizationsWithFirstUser} from '../data/people/update-organizations-with-first-user';
import {syncNewHubspotCompanies} from '../hubspot-apis/hubspot-company';

const runProcess = async () => {
  await syncNewHubspotCompanies();
  await updateOrganizationsWithFirstUser();
  process.exit();
};

runProcess();
