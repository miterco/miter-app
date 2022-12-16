import {MeetingTimeResponseBody, ExpressResponse} from 'miter-common/SharedTypes';
import {getMeetingForExternalIdentifier} from './endpoint-meeting-logic';
import httpEndpoint from '../../server-core/http/http-endpoint';
import {MeetingWithToken} from '../../server-core/server-types';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';

const timeWindowMinutesBefore = 5; // This constant defines the number of before the calendar event start time that we want to consider a mmeeting to potentially be active
const timeWindowMinutesAfter = 10; // This constant defines the number of after the calendar event end time that we want to consider a mmeeting to potentially be active

export const getMeetingTimeInfoEndpoint = httpEndpoint(withHttpUser, async ({user, params}, res) => {
  let meetingWithGuaranteedNullToken: MeetingWithToken;
  try {
    meetingWithGuaranteedNullToken = await getMeetingForExternalIdentifier(user, params.externalMeetingIdentifier);
  } catch (err: any) {
    const response: ExpressResponse = {success: false, error: err.message || err};
    res.status(200).json(response);
    return;
  }

  const {meeting} = meetingWithGuaranteedNullToken;

  const currentTime = new Date().getTime();
  const meetingStartTime = meeting.startDatetime;
  const meetingEndTime = meeting.endDatetime;
  if (!meetingStartTime || !meetingEndTime) throw new Error(`Meeting times not available for meeting ${meeting.id}.`);

  const windowStartTime = meetingStartTime.setMinutes(meetingStartTime.getMinutes() - timeWindowMinutesBefore);
  const windowEndTime = meetingEndTime.setMinutes(meetingEndTime.getMinutes() + timeWindowMinutesAfter);

  const isScheduledAroundNow = windowStartTime <= currentTime && currentTime <= windowEndTime;

  // TODO: Update this sharedtype to 2nd phase of project
  const responseBody: MeetingTimeResponseBody = {
    startDate: null,
    endDate: null,
    startTime: meetingStartTime,
    endTime: meetingEndTime,
    phase: meeting.phase,
    isScheduledAroundNow,
  };
  // TODO: This piece of code could be refactored using templates as follows:
  //
  // const response: ExpressResponse<MeetingTimeResponseBody> = {
  //   success: true,
  //   body: {
  //     startDate: null,
  //     endDate: null,
  //     startTime: meetingStartTime,
  //     endTime: meetingEndTime,
  //     phase: meeting.phase,
  //     isScheduledAroundNow,
  //   }
  // };
  //
  const response: ExpressResponse = {success: true, body: responseBody};
  res.status(200).json(response);
});
