import {prepareAndSendEmailJobs} from './prepare-and-send-email-jobs';

export const runProcess = async () => {
  await prepareAndSendEmailJobs();
  process.exit();
};

console.log('Started Scheduled Email Jobs');
runProcess();
