import { connectHistoricalContacts } from '../hubspot-apis/hubspot-contacts';

const runProcess = async () => {
  await connectHistoricalContacts();
  process.exit();
};

runProcess();