import {checkEnvironmentVariables} from '../../server-core/server-util';

const envVal = Number(process.env.SUMMARY_SEND_DELAY_MINUTES);
if (!envVal) console.warn('Missing summary-send-delay environment variable.');
export const DelayMinutes = envVal || 60;

export const getDefaultAutomatedSendTime = (): Date => {
  const defaultTime = new Date(new Date().getTime() + 1000 * 60 * DelayMinutes);

  return defaultTime;
};
