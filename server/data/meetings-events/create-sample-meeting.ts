import {getStartOfHour} from 'miter-common/CommonUtil';
import {FullPersonWithEmail, UserRecord} from '../../server-core/server-types';
import {OneHour} from '../data-util';
import {createSummaryItem} from '../notes-items/create-summary-item';
import {addMeetingAttendee} from '../people/add-meeting-attendee';
import {fetchOrganizationById} from '../people/fetch-organization';
import {copyTopicsFromTemplateToMeeting} from '../topics/copy-topics-from-template-to-meeting';
import {createMeeting} from './create-meeting';

export const OnboardingTemplateId = '25627752-49c4-4ca9-af7f-b8aa214bf045';

export const createSampleMeeting = async (user: UserRecord, associatedPerson: FullPersonWithEmail) => {
  const topOfTheHour = getStartOfHour(new Date());

  const startDatetime = topOfTheHour;
  const endDatetime = new Date(topOfTheHour.getTime() + OneHour);

  let meetingLockingOrganizationID: string | null = null;
  if (user.organizationId) {
    const organization = await fetchOrganizationById(user.organizationId);
    meetingLockingOrganizationID = organization.isLocked ? organization.id : null;
  }
  // We will invite the person to a calendar event so that we can track if they actually connect to the smaple meeting
  // (i.e. we can track sample meetings with attendees)

  const meeting = await createMeeting({
    title: 'Sample Miter Meeting',
    startDatetime,
    endDatetime,
    organizationId: meetingLockingOrganizationID,
    phase: 'NotStarted',
    goal: null,
    allDay: false,
    zoomMeetingId: null,
    zoomNumericMeetingId: null,
    isSampleMeeting: true,
  });

  await addMeetingAttendee(meeting.id, user.id);
  const updatedMeeting = await copyTopicsFromTemplateToMeeting(OnboardingTemplateId, meeting.id, true);
  await createSummaryItem({
    meetingId: meeting.id,
    createdBy: null,
    itemType: 'Task',
    itemText: `${user.loginEmail} to try assigning an Action Item by tagging the person at the beginning of a note.`,
    noteId: null,
    targetDate: endDatetime,
  });

  return updatedMeeting.meeting;
};
