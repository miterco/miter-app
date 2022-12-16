import {SendSummaryEmailRequest} from 'miter-common/SharedTypes';
import {sendEmail} from '../email/email';
import {generateSummaryEmail} from '../email/summary-email';
import {EmailJobName, JobStatus, UnsavedManualEmailJob} from '../server-core/server-types';
import {cancelSummaryEmailJobsForMeeting} from '../data/jobs/summary-email-job';
import {createManualEmailJob} from '../data/jobs/create-email-job';
import socketEndpoint from '../server-core/socket/socket-endpoint';
import withSocketUser from '../server-core/socket/middlewares/with-socket-user';
import {messageBodySchema} from '../server-core/socket/middlewares/message-body-schema';
import Joi from 'joi';

export default socketEndpoint(
  messageBodySchema({
    recipients: Joi.array()
      .required()
      .min(1)
      .items(Joi.object({name: Joi.string(), email: Joi.string().email().required()})),
  }),
  withSocketUser,
  async ({body, user, meetingId}, _res) => {
    const {recipients} = body as SendSummaryEmailRequest;
    const emailInfo = await generateSummaryEmail(meetingId, recipients);

    const job: Omit<UnsavedManualEmailJob, 'jobStatus'> = {
      jobName: EmailJobName.SummaryEmail,
      meetingId,
      jobRecipients: recipients,
      creatorId: user?.id || undefined,
    };

    try {
      const sendResult = await sendEmail(emailInfo);
      if (!sendResult) throw new Error('Unknown error sending email.'); // Not sure there's actually a code path to this.
      await createManualEmailJob({...job, jobStatus: JobStatus.Completed});
      await cancelSummaryEmailJobsForMeeting(meetingId);
      return {};
    } catch (err: any) {
      await createManualEmailJob({...job, jobStatus: JobStatus.Failed});
      throw new Error(err.toString());
    }
  }
);
