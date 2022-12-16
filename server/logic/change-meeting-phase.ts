import {MeetingPhase} from 'miter-common/SharedTypes';
import {createAutomatedEmailJob} from '../data/jobs/create-email-job';
import {cancelSummaryEmailJobsForMeeting} from '../data/jobs/summary-email-job';
import {updateMeeting} from '../data/meetings-events/update-meeting';
import {fetchMeeting} from '../data/meetings-events/fetch-meeting';
import {fetchAttendees} from '../data/people/fetch-attendees';
import {EmailJobName, UserRecord} from '../server-core/server-types';
import {convertUserRecordToRecipient} from '../server-core/server-util';

export const changeMeetingPhase = async (meetingId: string, newPhase: MeetingPhase) => {
  const meetingBefore = await fetchMeeting(meetingId);
  if (meetingBefore.phase !== 'Ended' && newPhase === 'Ended') {
    const attendees: UserRecord[] = await fetchAttendees(meetingId);
    const jobRecipients = attendees.map(attendee => convertUserRecordToRecipient(attendee));
    createAutomatedEmailJob({jobName: EmailJobName.SummaryEmail, meetingId, jobRecipients});
  } else if (meetingBefore.phase === 'Ended' && newPhase !== 'Ended') {
    // If we're re-opening the meeting, cancel any automated summary email jobs
    cancelSummaryEmailJobsForMeeting(meetingId);
  }

  return await updateMeeting({id: meetingId, phase: newPhase});
};
