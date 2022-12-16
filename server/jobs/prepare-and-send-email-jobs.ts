import {EmailRecipient} from 'miter-common/SharedTypes';
import {completeEmailJob} from '../data/jobs/update-email-job';
import {fetchReadyToRunEmailJobs} from '../data/jobs/fetch-email-job';
import {fetchStaleMeetings} from '../data/meetings-events/fetch-stale-meetings';
import {fetchAllNotes} from '../data/notes-items/fetch-all-notes';
import {fetchAllSummaryItems} from '../data/notes-items/fetch-all-summary-items';
import {sendEmail} from '../email/email';
import {generateSummaryEmail} from '../email/summary-email';
import {changeMeetingPhase} from '../logic/change-meeting-phase';
import {EmailJobName} from '../server-core/server-types';

export const sendSummaryEmailForJob = async (jobId: string, meetingId: string, recipients: EmailRecipient[]) => {
  try {
    // TODO: We're doing a double-fetch here: we fetch both notes and summary items inside generateSummaryEmail.
    const hasAppropriateContent = Boolean(
      (await fetchAllNotes(meetingId, true)).length || (await fetchAllSummaryItems(meetingId)).length
    );
    if (hasAppropriateContent) {
      const emailInfo = await generateSummaryEmail(meetingId, recipients);
      const emailResult = await sendEmail(emailInfo);
      if (!emailResult) throw 'Unable to send email for ${messageId}.'; // Not sure there's actually a code path to this.
    } else {
      console.log(`Email skipped for Meeting: ${meetingId} due to lack of content`);
    }
    await completeEmailJob(jobId, true);
  } catch (err) {
    console.error(err);
    await completeEmailJob(jobId, false);
  }
};

const endStaleMeetings = async () => {
  const staleMeetings = await fetchStaleMeetings();
  const phaseChangePromises = staleMeetings.map(({id}) => changeMeetingPhase(id, 'Ended')); // Intentionally not awaiting
  await Promise.allSettled(phaseChangePromises);
};

export const prepareAndSendEmailJobs = async () => {
  await endStaleMeetings();

  const jobList = await fetchReadyToRunEmailJobs(EmailJobName.SummaryEmail);
  if (jobList.length > 0) {
    const promises = jobList.map(scheduledJob => {
      if (scheduledJob.meetingId) {
        console.log(`Sending Email for Meeting: ${scheduledJob.meetingId}`);
        return sendSummaryEmailForJob(scheduledJob.id, scheduledJob.meetingId, scheduledJob.jobRecipients);
      }

      return Promise.resolve();
    });
    await Promise.all(promises);
  }
};
