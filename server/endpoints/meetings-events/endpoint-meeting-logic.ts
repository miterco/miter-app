/*
 * Business logic for meetings and the wrangling thereof, esp. when needed across
 * endpoints. For general endpoint utilities, see endpoint-utils.ts.
 */

import {ErrorCode, MiterError, ValidationError} from 'miter-common/SharedTypes';
import {fetchMeetingByToken} from '../../data/fetch-token';
import {createBulkCalendarEvents} from '../../data/meetings-events/create-bulk-calendar-events';
import {fetchCalendarEventByGoogleId} from '../../data/meetings-events/fetch-calendar-event';
import {fetchMeetingByCalendarEvent} from '../../data/meetings-events/fetch-meeting';
import {getSingleEventFromGoogle, convertGoogleEventsToCalendarEvents} from '../../google-apis/google-calendar';
import {trackAnalyticsEvent} from '../../server-core/analytics';
import {
  MeetingIdentifierType,
  FullCalendarEventRecord,
  MeetingWithToken,
  UserRecord,
} from '../../server-core/server-types';
import {CalendarEvent} from '../../server-core/server-types';

//
// Take a string in any one of the meeting-identifier formats we accept and disambiguate / parse. May be able to use this in more places?
//
export const parseExternalMeetingIdentifier = (identifier: any): {idType: MeetingIdentifierType; id: string} => {
  if (!identifier) {
    throw new ValidationError(`While validating external identifier, got something falsy (${identifier}).`);
  }
  if (typeof identifier !== 'string') {
    throw new ValidationError(`While validating external identifier, expected string but got ${typeof identifier}.`);
  }

  const idType: MeetingIdentifierType = identifier.startsWith('g_') ? 'Google' : 'Token';

  return {idType, id: idType === 'Token' ? identifier : identifier.slice(2)};
};

export const parseAndValidateExternalMeetingIdentifier = (
  identifier: any
): {idType: MeetingIdentifierType; id: string} => {
  const parsed = parseExternalMeetingIdentifier(identifier);
  if (parsed.idType === 'Other') {
    throw new ValidationError(`Attempt to retrieve meeting for invalid identifier ${identifier}.`);
  }

  return parsed;
};

export const getCalendarEventFromFullRecord = (fullRecord: FullCalendarEventRecord): CalendarEvent => {
  return {...fullRecord, serviceId: undefined, userId: undefined};
};

export const getMeetingForExternalIdentifier = async (
  user: UserRecord | null | undefined,
  externalIdentifier: string
): Promise<MeetingWithToken> => {
  const {id: tokenOrEventId, idType} = parseAndValidateExternalMeetingIdentifier(externalIdentifier);

  if (idType === 'Token') {
    // We have a Miter meeting token. So we either have a meeting for it or we don't. Either way, return.
    return {meeting: await fetchMeetingByToken(tokenOrEventId), token: tokenOrEventId};
  } else {
    // We have a Google event ID ("service ID").

    // You have to be an authenticated user to look access meetings by their Google event ID. This isn't a "true" error
    // case: a user who's installed the extension but bailed out of sign-in will produce this.
    if (!user) {
      throw new MiterError(
        "It looks like you're not signed in. Try refreshing your browser — you should see a Miter sign-in screen.",
        ErrorCode.NotAuthenticated
      );
    }

    // We have a Google event ID and an authenticated user. (TODO: Could this be a Zoom user and thus not have Google
    // access?) Let's see if Google has the event and we're permitted access to it.

    try {
      const gEvent = await getSingleEventFromGoogle(user.id, tokenOrEventId);

      // getSingleEventFromGoogle only looks up the primary calendar. This blocks users from accessing Miter details
      // for events on OTHER PEOPLE's calendars to which they have GCal access, which is what we want. This will also
      // block access to events on any non-primary calendars belonging to the user, but that's another problem for
      // another day. If gEvent is null, it's because we got back a 404 indicating the event wasn't found on the primary
      // calendar.
      if (!gEvent) {
        throw new MiterError(
          'We were unable to access a Miter meeting for this Google event. Typically, this happens when the event is not on your calendar.',
          ErrorCode.NotFound
        );
      }

      // We've got a Google event. (Otherwise we'd be in the catch block.) Dunno whether it's recurring, instance, etc.,
      // and don't care — we have logic elsewhere to do the right thing. That fetch from Google was primarily about
      // checking access.

      const existingCalendarEvent = await fetchCalendarEventByGoogleId(tokenOrEventId);
      if (!existingCalendarEvent) {
        // The check above should rarely fail (?) since we get things via GCal push, but it will happen e.g., if the user
        // is clicking on meetings outside the window we've pulled. We only ingest the meeting if it's new to avoid
        // unnecessarily reingesting all the time and also to avoid overwriting in-Miter changes.

        const converted = await convertGoogleEventsToCalendarEvents(
          [gEvent],
          user.id,
          'getMeetingForExternalIdentifier (joinMeeting OR getMeetingTimeInfo)'
        );
        const created = await createBulkCalendarEvents(converted, user);
        if (!created || !created.length) {
          throw new Error('While getting a Google event on demand, createBulkCalendarEvents failed.');
        }

        return {meeting: await fetchMeetingByCalendarEvent(created[0].id), token: null};
      } else {
        return {meeting: await fetchMeetingByCalendarEvent(existingCalendarEvent.id), token: null};
      }
    } catch (err) {
      if (!(err instanceof MiterError)) console.error(err);
      throw err;
    }
  }
};
