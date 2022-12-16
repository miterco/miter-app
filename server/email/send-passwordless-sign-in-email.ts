import {EmailRecipient} from 'miter-common/SharedTypes';
import {EmailJobName, JobStatus, UnsavedAutomatedEmailJob, UserRecord} from '../server-core/server-types';
import {renderContentTemplate} from './content-templates';
import {sendEmail} from './email';
import {createManualEmailJob} from '../data/jobs/create-email-job';

const {HOST} = process.env;
const defaultSender: EmailRecipient = {name: 'Miter', email: 'meetings@miter.app'};

export const sendPasswordlessSignInEmail = async (token: string, user: UserRecord) => {
  const templateData = {url: `${HOST}/sign-in/pwless/verify?code=${token}`};
  const html = await renderContentTemplate('passwordless-sign-in-email', templateData);
  const text = await renderContentTemplate('passwordless-sign-in-email-plain', templateData);
  const recipients = [{name: user.displayName || undefined, email: user.loginEmail}];

  const job: Omit<UnsavedAutomatedEmailJob, 'jobStatus'> = {
    jobName: EmailJobName.PasswordlessSignInEmail,
    jobRecipients: recipients,
    creatorId: user.id,
  };

  try {
    await sendEmail({
      to: recipients,
      from: defaultSender,
      subject: 'Verify your Miter account email',
      html,
      text,
    });

    await createManualEmailJob({...job, jobStatus: JobStatus.Completed});
    return {html, text};
  } catch (err: any) {
    await createManualEmailJob({...job, jobStatus: JobStatus.Failed});
    return false;
  }
};
