import {
  BulkMeetingResponse,
  ExpressResponse,
  MeetingsFromTodayRequest,
  ValidationError,
} from 'miter-common/SharedTypes';
import {createOrFetchBulkTokensForMeetingIds} from '../../data/create-bulk-tokens';
import {fetchBulkCalendarEventsByServiceId} from '../../data/meetings-events/fetch-bulk-calendar-events';
import {fetchMeetingsInWindow} from '../../data/meetings-events/fetch-meetings-in-window';
import {
  convertGoogleEventsToCalendarEvents,
  getDateDaysAfterToday,
  getSingleEventsInWindow,
} from '../../google-apis/google-calendar';
import httpEndpoint from '../../server-core/http/http-endpoint';
import {getStartOfDay, getEndOfDay, uuid} from 'miter-common/CommonUtil';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';

const DefaultWindowStartOffset = -3;
const DefaultWindowEndOffset = 3;

const validateParams = (params: any): Required<MeetingsFromTodayRequest> => {
  const startOffset = params.startOffset ? Number(params.startOffset) : DefaultWindowStartOffset;

  if (isNaN(startOffset)) {
    throw new ValidationError(
      `getMeetingsFromTodayEndpoint: got request with a non-numeric start offset: ${startOffset}`
    );
  }
  const endOffset = params.endOffset ? Number(params.endOffset) : DefaultWindowEndOffset;

  if (isNaN(endOffset)) {
    throw new ValidationError(`getMeetingsFromTodayEndpoint: got request with a non-numeric end offset: ${endOffset}`);
  }
  if (startOffset === endOffset) {
    throw new ValidationError('getMeetingsFromTodayEndpoint: got equal start and end offsets.');
  }

  const callContext = typeof params.callContext === 'string' ? params.callContext : '';
  const clientVersion = typeof params.clientVersion === 'number' ? params.clientVersion : 0;
  const winAge = typeof params.winAge === 'number' ? params.winAge : 0;

  return {
    startOffset,
    endOffset,
    callContext,
    clientVersion,
    winAge,
  };
};

export const getMeetingsFromTodayEndpoint = httpEndpoint(withHttpUser, async (req, res) => {
  const {user} = req;
  const tzOffset = Number(req.query.tzOffset) || 0;

  if (!user?.id) {
    return {meetings: []};
  }

  if (!user.personId) {
    throw new Error(`getMeetingsFromTodayEndpoint: Called with user ${user.id}, which lacks a person`);
  }

  const validParams = validateParams(req.query);
  const meetingIdSet = new Set<string>();

  if (user.serviceId) {
    try {
      // If we have access to Google Calendar, grab the latest.
      // TODO do we still need this at all?
      const eventsResult = await getSingleEventsInWindow(
        user.id,
        validParams.startOffset, // Number of days to the start of the time window, relative to today.
        validParams.endOffset, // Number of days to the end of the time window, relative to today.
        tzOffset // User timezone offset.
      );

      const calendarEventsToSave = await convertGoogleEventsToCalendarEvents(
        eventsResult,
        user.id,
        'getMeetingsFromToday'
      );
      const serviceIds = calendarEventsToSave.map(event => event.serviceId || '');
      const calendarEvents = await fetchBulkCalendarEventsByServiceId(serviceIds);
      calendarEvents.forEach(calEvent => meetingIdSet.add(calEvent.meetingId));
    } catch (error) {
      console.error(`getMeetingsFromTodayEndpoint: Failed to retrieve from GCal for user ${user.id}`);
    }
  }

  const attendedMeetings = await fetchMeetingsInWindow(
    user.personId,
    getStartOfDay(getDateDaysAfterToday(validParams.startOffset), tzOffset), // Start of time window.
    getEndOfDay(getDateDaysAfterToday(validParams.endOffset), tzOffset) // End of time window.
  );

  attendedMeetings.forEach(meetingRow => meetingIdSet.add(meetingRow.meeting.id));

  // TODO: START PASSING BACK FULL CONTENT FLAG INFO
  const meetingTokens = await createOrFetchBulkTokensForMeetingIds(Array.from(meetingIdSet));

  const responseBody: BulkMeetingResponse = {meetings: meetingTokens};

  const response: ExpressResponse = {
    success: true,
    body: responseBody,
  };

  res.status(200).json(response);
});
