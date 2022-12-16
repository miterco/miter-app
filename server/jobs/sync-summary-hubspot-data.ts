import { populateHubspotSummaryData } from '../hubspot-apis/hubspot-summary-data';

const runProcess = async () => {
  await populateHubspotSummaryData();
  process.exit();
};

runProcess();