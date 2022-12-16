import {calendar_v3, google} from 'googleapis';
import {getEndOfDay, getStartOfDay} from 'miter-common/CommonUtil';
import {ValidationError} from 'miter-common/SharedTypes';
import {v4 as uuid} from 'uuid'; // Creating uuids here to keep the CalendarEvent type clean rather than relying on db to autogenerate
import {editGoogleIdentifiers} from '../data/edit-google-identifiers';
import {fetchGoogleIdentifiers, fetchGoogleIdentifiersByChannelId} from '../data/fetch-google-identifiers';
import {createBulkCalendarEvents, CalendarEventStatus} from '../data/meetings-events/create-bulk-calendar-events';
import {logEventJson, UnsavedGoogleEvent} from '../data/meetings-events/log-event-json';
import {GoogleEventType, Attendee, UnsavedCalendarEventWithAttendees, UserRecord} from '../server-core/server-types';
import {parseGoogleEventId} from '../server-core/server-util';
import * as gAuth from './google-auth';

const NearTermInstancesStartOffsetDays = -1;
const NearTermInstancesEndOffsetDays = 2;

export const getDateDaysAfterToday = (days: number) => {
  return new Date(Date.now() + days * 24 /* hrs/day*/ * 60 /* min/hr*/ * 60 /* sec/min*/ * 1000 /* ms/s*/);
};

/*
//const descParser = /<span[^>]*>.*?<strong>(.*?)<\/strong>.*?<a href=".*\/app\/m\/m_([^?]*)\?mitersrc=/;
const descParser = /<span[^>]*>.*?<strong>(.*?)<\/strong>.*?<a href=".*mitersrc=.+meetingId=([^&?"]*)/;

export const parseMiterDetailsFromDescription = (description: string) => {
  const parseResult = description.match(descParser);
  if (parseResult) {
    const rawGoal = parseResult[1].trim();
    return { meetingId: parseResult[2], goal: (rawGoal === 'Not specified' ? '' : rawGoal) };
  }
  return { meetingId: null, goal: null };
};
*/

/*
 * Called during sign-in to establish our connection with GCal as appropriate. We may or may not be able
 * to set up the connection yet depending on whether we've been granted calendar scope yet. Does not fetch any calendar
 * data itself.
 */
interface GCalConnectionResult {
  connected: boolean;
  needInitialPull: boolean;
}
export const establishCalendarConnectionIfNeeded = async (userId: string): Promise<GCalConnectionResult> => {
  console.log(`Establishing calendar connection if needed for user ${userId}.`);
  const gIdentifiers = await fetchGoogleIdentifiers(userId);
  if (!gIdentifiers) {
    throw new Error('Failed to retrieve Google identifiers for a user. (This could result in no sync token.)');
  }

  // We may or may not have access to GCal at this point. If we don't, just bail out and hope we get it later.
  // TODO could be more robust. In particular, should we even request offline access or store tokens server-side
  // if we lack calendar access? Mostly we're doing it at this point to reduce the number of code paths.
  if (!(await isCalendarAccessEnabledForUser(userId))) {
    // console.log(`User ${userId} signed in but we don't have calendar access (yet).`);
    return {connected: false, needInitialPull: false};
  }

  // TODO: Should we run this on every sign in? If Calendar access is revoked by Google, then the existing
  // gcalPushChannel won't work and this code won't refresh it since it's not null.
  if (!gIdentifiers.gcalPushChannel) {
    // We don't have a subscription set up yet (new user or otherwise), so let's do that.
    // console.log(`User ${userId} lacks a stored push channel. Setting up.`);
    const pushResult = await createPushChannel(userId);
    if (!pushResult?.channelId) {
      throw new Error('Failed to create GCal push channel. (This would result in no sync token, too.)');
    }

    // Save push channel info (which won't have sync token yet)
    await editGoogleIdentifiers(userId, {
      gcalPushChannel: pushResult.channelId,
      gcalResourceId: pushResult.resourceId,
      gcalPushChannelExpiration: pushResult.expirationDate,
    });

    return {connected: true, needInitialPull: true};
  }

  return {connected: true, needInitialPull: false};
};

/*
 * Does the main post-sign-in (or post-connection-setup) pull of calendar data starting three days in the
 * past and going indefinitely into the future. Does not pull single instances. Grabs and stores a GCal
 * sync token so we can do incremental updates in the future when we get a push notification from Google.
 * Assumes we already have a calendar connection via establishCalendarConnectionIfNeeded().
 */
export const getInitialGoogleCalendarDataAndStartSync = async (user: UserRecord) => {
  try {
    const eventsResult = await getAllEventsInWindow(user.id);
    if (!eventsResult) {
      throw new ValidationError(
        'getAllEventsInWindow should never return null. Throwing as a precursor to changing its signature.'
      );
    }
    const calendarEvents = await convertGoogleEventsToCalendarEvents(
      eventsResult.events,
      user.id,
      'Sign Up Flow - Initial Sync'
    );
    await editGoogleIdentifiers(user.id, {gcalSyncToken: eventsResult.syncToken});
    await createBulkCalendarEvents(calendarEvents, user);
  } catch (err) {
    console.log(err);
  }
};

/*
 * Our other similar function, getInitialGoogleCalendarDataAndStartSync(), initiates our main, ongoing
 * data relationship with GCal but doesn't give us single event instances for the meeting list. That's
 * maintained via nightly pulls, but until the next one of those we need to kickstart it. That's what
 * this function does: pulls single instances for a near-term window. Assumes we already have a calendar
 * connection via esetablishCalendarConnectionIfNeeded().
 */
export const getInitialNearTermSingleEventInstances = async (user: UserRecord, tzOffset: number | null) => {
  try {
    const eventsFromTodayResult = await getSingleEventsInWindow(
      user.id,
      NearTermInstancesStartOffsetDays,
      NearTermInstancesEndOffsetDays,
      tzOffset
    );
    const calendarEvents = await convertGoogleEventsToCalendarEvents(
      eventsFromTodayResult,
      user.id,
      'Sign Up Flow - Get Single Instances from Near Term'
    );
    await createBulkCalendarEvents(calendarEvents, user);
  } catch (err) {
    console.log(err);
  }
};

export const createPushChannel = async (
  userId: string
): Promise<{channelId: string; resourceId: string; expirationDate: Date | null} | null> => {
  // When testing, we want these channels to expire so we don't have to delete them manually.
  const expirationHours = Number(process.env.EXPIRE_GCAL_PUSH_AFTER_HOURS);
  const expirationStamp = expirationHours
    ? `${Date.now() + expirationHours * 60 /* min*/ * 60 /* sec/min*/ * 1000 /* ms/s*/}`
    : undefined;

  try {
    const authClient = await gAuth.getAuthClient(userId);
    const calendar = google.calendar({version: 'v3', auth: authClient});

    const channelId = uuid();
    const watchResult = await calendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: process.env.GCAL_PUSH_ENDPOINT,
        expiration: expirationStamp,
      },
    });

    const {resourceId} = watchResult.data;
    if (!resourceId) {
      throw new Error(`Push notification response lacks a resource ID for Channel: ${channelId}`);
    }

    if (!watchResult.data.expiration) console.log(`No expiration date returned for Resource: ${resourceId}`);
    const expirationDate = watchResult.data.expiration ? new Date(Number(watchResult.data.expiration)) : null;

    return {channelId, resourceId, expirationDate};
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const renewPushChannel = async (userId: string) => {
  const gIdentifiers = await fetchGoogleIdentifiers(userId);
  if (!gIdentifiers) throw new Error(`Failed to retrieve Google identifiers for a user: ${userId}`);

  const newPushChannel = await createPushChannel(userId);
  if (!newPushChannel?.channelId) throw new Error(`Failed to renew GCal push channel for user: ${userId}`);

  await editGoogleIdentifiers(userId, {
    gcalPushChannel: newPushChannel.channelId,
    gcalResourceId: newPushChannel.resourceId,
    gcalPushChannelExpiration: newPushChannel.expirationDate,
  });

  if (gIdentifiers.gcalPushChannel && gIdentifiers.gcalResourceId) {
    const authClient = await gAuth.getAuthClient(userId);

    cancelPushChannel(userId, gIdentifiers.gcalPushChannel, gIdentifiers.gcalResourceId);
  }

  return {pushChannel: gIdentifiers.gcalPushChannel, resourceId: gIdentifiers.gcalResourceId};
};

export const cancelPushChannel = async (userId: string, pushChannel: string, resourceId: string) => {
  try {
    const authClient = await gAuth.getAuthClient(userId);
    const calendar = google.calendar({version: 'v3', auth: authClient});

    const cancelResult = await calendar.channels.stop({requestBody: {id: pushChannel, resourceId}});

    return Boolean(cancelResult);
  } catch {
    console.log(
      `Unable to unsubscribe push channel, User Id: ${userId} | Push Channel Id: ${pushChannel} | Resource Id: ${resourceId} `
    );
    return false;
  }
};

export const renewSyncToken = async (user: UserRecord) => {
  try {
    const eventsResult = await getAllEventsInWindow(user.id);
    if (eventsResult) {
      // getAllEventsInWindow should never return null. Maybe fix this a a type-check level.
      await editGoogleIdentifiers(user.id, {gcalSyncToken: eventsResult.syncToken});
      const calendarEvents = await convertGoogleEventsToCalendarEvents(
        eventsResult.events,
        user.id,
        'Renew Sync Tokens'
      );
      await createBulkCalendarEvents(calendarEvents, user);
    }
  } catch (err) {
    console.error(err);
  }
};

/* export const deletePushChannel = async (userId: string, channelId: string, resourceId: string) => {
  try {
    const authClient = await gAuth.getAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const result = await calendar.channels.stop({requestBody: {resourceId, id: channelId}})
    return true;
  } catch(err) {
    console.error(err);
    return false;
  }
} */

type EventGetter = (
  userId: string
) => Promise<{events: calendar_v3.Schema$Event[]; syncToken: string; userId: string} | null>;

export const getAllEventsInWindow: EventGetter = async userId => {
  const authClient = await gAuth.getAuthClient(userId);
  const calendar = google.calendar({version: 'v3', auth: authClient});

  try {
    // TODO maybe implement paging
    const calResult = await calendar.events.list({
      calendarId: 'primary',
      timeMin: getDateDaysAfterToday(-3).toISOString(), // Grab events starting a week ago. This will include recurring that started earlier.
      maxResults: 2500,
      singleEvents: false,
    });

    if (!calResult.data.nextSyncToken) {
      console.error(`Initial GCal pull returned ${calResult.data.items?.length} but no sync token for user ${userId}.`);
    }
    return {events: calResult.data.items || [], syncToken: calResult.data.nextSyncToken || '', userId};
  } catch (err: any) {
    if (err.response.data.error === 'invalid_grant') {
      // Access was revoked or something
      throw new Error(
        `getAllEventsInWindow: invalid auth while fetching from GCal for user ${userId}. Maybe user has revoked it?`
      );
    } else {
      console.error(err.response.data);
      throw err;
    }
  }
};

/**
 * Checks whether the given user has Calendar access enabled or not.
 *
 * @param userId - A valid user ID.
 * @returns whether the user has Calendar access.
 */
export const isCalendarAccessEnabledForUser = async (userId: string): Promise<boolean> => {
  try {
    const authClient = await gAuth.getAuthClient(userId);
    const calendar = google.calendar({version: 'v3', auth: authClient});
    const calResult = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 1,
    });

    return true;
  } catch (err: any) {
    return false;
  }
};

/**
 * Retrieve the list of Google Calendar events for a given user in the indicated time window.
 *
 * @param userId - The Miter user ID.
 * @param windowStart - the start of the time window (in days) relative to today's date.
 * @param windowEnd - the end of the time window (in days) relative to today's date.
 * @param tzOffset - the offset of the user timezone in seconds with respect to UTC.
 * @return the list of events in the time window for the given user.
 */
export const getSingleEventsInWindow = async (
  userId: string,
  windowStart: number,
  windowEnd: number,
  tzOffset: number | null
): Promise<calendar_v3.Schema$Event[]> => {
  const authClient = await gAuth.getAuthClient(userId);
  const calendar = google.calendar({version: 'v3', auth: authClient});

  try {
    // TODO maybe implement paging
    const calResult = await calendar.events.list({
      calendarId: 'primary',
      timeMin: getStartOfDay(getDateDaysAfterToday(windowStart), tzOffset).toISOString(),
      timeMax: getEndOfDay(getDateDaysAfterToday(windowEnd), tzOffset).toISOString(),
      maxResults: 2500,
      singleEvents: true, // Have Google compute the events for us
    });

    return calResult.data.items || [];
  } catch (err: any) {
    if (err.response.data.error === 'invalid_grant') {
      // Access was revoked or something
      throw new Error(
        `getSingleEventsInWindow: invalid auth while fetching from GCal for user ${userId}. Maybe user has revoked it?`
      );
    } else {
      console.error(err.response.data);
      throw err;
    }
  }
};

export const getChangedEventsForChannel: EventGetter = async (channelId: string) => {
  const user = await fetchGoogleIdentifiersByChannelId(channelId);
  if (user) {
    if (user.gcalSyncToken) {
      const authClient = await gAuth.getAuthClient(user.id);
      const calendar = google.calendar({version: 'v3', auth: authClient});

      try {
        const calResult = await calendar.events.list({
          calendarId: 'primary',
          syncToken: user.gcalSyncToken,
          maxResults: 2500,
          singleEvents: false,
        });

        // TODO maybe implement paging
        return {events: calResult.data.items || [], syncToken: calResult.data.nextSyncToken || '', userId: user.id};
      } catch (err: any) {
        if (err.response.data.error === 'invalid_grant') {
          // Access was revoked or something
          throw new Error(
            `getChangedEventsForChannel: invalid auth while fetching from GCal for user ${user.id}. Maybe user has revoked it?`
          );
        } else {
          console.error(err.response.data);
          throw err;
        }
      }
    } else {
      // User lacks a GCal sync token. We don't really expect this to happen but so long as it does, maybe
      // we can recover.
      console.log(`User ${user.id} lacks GCal sync token; attempting sync from scratch.`);
      const result = await getAllEventsInWindow(user.id);
      if (!result) throw new Error(`From-scratch GCal sync initiated via empty sync token failed for user ${user.id}.`);
      if (!result.syncToken) throw new Error(`Attempt to restore missing sync token failed for user ${user.id}`);
      await editGoogleIdentifiers(user.id, {gcalSyncToken: result.syncToken});
      return result;
    }
  } else {
    // We were unable to locate a user associated with this channel

    if (process.env.DEBUG) {
      console.warn("Missing user for Google channel. Could just be a test channel that hasn't expired.");
    } else console.error('Missing user for Google channel.');
    return null;
  }
};

export const getSingleEventFromGoogle = async (userId: string, eventId: string) => {
  const authClient = await gAuth.getAuthClient(userId);
  const calendar = google.calendar({version: 'v3', auth: authClient});

  try {
    const calResult = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    return calResult.data;
  } catch (err: any) {
    // Google is sending us something that isn't an Error object...this clause converts what we get to either a null
    // return value or a true error object.
    if (err.response.data.error === 'not_found' || err.code === 404) {
      // Event wasn't found on user's primary calendar. Not really an error from our perspective.
      // TODO: I'm not actually sure the 404 ever happens vs. not_found.
      return null;
    } else if (err.response.data.error === 'invalid_grant') {
      // Access was revoked or something.
      throw new Error('Invalid auth while fetching a single Google Calendar event.');
    } else {
      throw new Error(`Error while fetching single event from Google: ${JSON.stringify(err)}`);
    }
  }
};

export const determineGoogleEventType = (
  eventId: string,
  recurrence: any,
  recurringEventId: string | null | undefined
): {type: GoogleEventType; convertedRecurringId: string | undefined} => {
  // Cases we get from Google:
  // (A) Single: event ID is a base ID (no coda), no recurrence, no recurring calendar event ID.
  // (B) Normal First Instance (which is the same as a master instance): event ID is base ID (no coda), recurrence, no recurring calendar event ID
  // (C) Nth Instance: event ID is a compound (base + coda), no recurrence, and a recurring event ID that may or may not be compound
  // (D) Wild First Instance: event ID is a compound, recurrence, no recurring ID. This is a weird one.

  if (recurrence) {
    // This event is the first event in a series.
    const parsed = parseGoogleEventId(eventId);
    if (parsed?.coda) {
      // Case D
      // TODO does this need to be different from Nth Instance?
      return {type: 'NthInstance', convertedRecurringId: parsed.base};
    } else {
      // Case B
      return {type: 'FirstInstance', convertedRecurringId: eventId};
    }
  } else if (recurringEventId) {
    // Case C
    return {type: 'NthInstance', convertedRecurringId: parseGoogleEventId(recurringEventId)?.base};
  } else {
    // Case A
    return {type: 'Single', convertedRecurringId: undefined};
  }
};

export const convertGoogleEventsToCalendarEvents = async (
  gEvents: calendar_v3.Schema$Event[] | undefined,
  userId: string,
  callingProcess: string
) => {
  const calendarEventsResult: UnsavedCalendarEventWithAttendees[] = [];

  if (gEvents) {
    const eventsToLog: UnsavedGoogleEvent[] = gEvents.map(eventRow => ({
      eventId: eventRow.id || '',
      event: JSON.stringify(eventRow),
      userId,
      createdByProcess: callingProcess,
    }));

    await logEventJson(eventsToLog);

    gEvents.forEach((event, i) => {
      if (!event.id) {
        throw new ValidationError('While converting Google events to calendar events, got an event without an ID.');
      }

      const attendeesResult: Attendee[] = [];

      if (event.attendees) {
        event.attendees.forEach((person, i) => {
          if (person.email) {
            attendeesResult.push({
              id: uuid(), // TODO someday -- do we need to generate uuids here vs the DB?
              emailAddressId: uuid(),
              serviceId: person.id,
              email: person.email,
              displayName: person.displayName || '',
              optional: person.optional ?? false,
              responseStatus: person.responseStatus ?? '',
            });
          }
        });
      } else {
        // Meetings created by the user with no other attendees sometimes have no attendees, so we manually
        // add the organizer when there's nobody. We have not seen a case in which a non-zero-length attendee
        // array missed the organizer. But we haven't looked all that hard either.

        const person = event.organizer;
        if (person?.email) {
          attendeesResult.push({
            id: uuid(),
            emailAddressId: uuid(),
            serviceId: person.id,
            email: person.email,
            displayName: person.displayName || '',
            optional: false,
            responseStatus: '',
          });
        }
      }

      //   Leaving this here for checking what google sends
      //
      //   if (event.summary == 'Recurring Meeting' || event.summary == 'Miter <> MaC Bi-Weekly') {
      //     console.log(event);
      //   };

      const eventTypeInfo = determineGoogleEventType(event.id, event.recurrence, event.recurringEventId);

      calendarEventsResult.push({
        serviceId: event.id,
        title: event.summary || null,
        startDate: event?.start?.date ? new Date(event.start.date) : null,
        endDate: event?.end?.date ? new Date(event.end.date) : null,
        startTime: event?.start?.dateTime ? new Date(event.start.dateTime) : null,
        endTime: event?.end?.dateTime ? new Date(event.end.dateTime) : null,
        attendees: attendeesResult,
        recurringCalendarEventServiceId: eventTypeInfo.convertedRecurringId || null,
        recurrenceRule: event?.recurrence ? JSON.stringify(event.recurrence) : null,
        phase: 'NotStarted',
        googleEventType: eventTypeInfo.type,
        status: event.status as CalendarEventStatus,
      });
    });
  } else {
    console.warn('calendar.events.list returned undefined.');
  }

  return calendarEventsResult;
};
