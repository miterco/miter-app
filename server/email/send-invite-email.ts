import {EmailRecipient} from 'miter-common/SharedTypes';
import {createManualEmailJob} from '../data/jobs/create-email-job';
import {EmailJobName, JobStatus, UnsavedManualEmailJob, UserRecord} from '../server-core/server-types';
import {approximateNameFromEmail} from '../server-core/server-util';
import {renderContentTemplate} from './content-templates';
import {sendEmail} from './email';

const {HOST} = process.env;
const SenderEmail = 'meetings@miter.app';

export const sendInviteEmail = async (
  sender: UserRecord,
  recipient: EmailRecipient,
  inviteId: string,
  redirect: string
) => {
  const templateData = {
    senderName: sender.displayName || approximateNameFromEmail(sender.loginEmail),
    recipientName: recipient.name || approximateNameFromEmail(recipient.email),
    url: `${HOST}/invite/${inviteId}/accept?next=${redirect}`,
  };
  const html = await renderContentTemplate('invite-email', templateData);
  const text = await renderContentTemplate('invite-email-plain', templateData);

  const job: Omit<UnsavedManualEmailJob, 'jobStatus'> = {
    jobName: EmailJobName.InviteEmail,
    jobRecipients: [recipient],
    creatorId: sender.id,
  };

  try {
    await sendEmail({
      to: [recipient],
      from: {name: `${templateData.senderName} via Miter`, email: SenderEmail},
      subject: `${templateData.recipientName}, ${templateData.senderName} invited you to Miter!`,
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
