import {fetchEventJson} from '../data/meetings-events/fetch-event-json';
import {convertGoogleEventsToCalendarEvents} from '../google-apis/google-calendar';
import {calendar_v3} from 'googleapis';
import {createBulkCalendarEvents} from '../data/meetings-events/create-bulk-calendar-events';
import {fetchUserByMiterId} from '../data/people/fetch-user';

export const rerunJson = async (eventId: string) => {
  if (!eventId) throw 'eventId not supplied';

  const logEntry = await fetchEventJson(eventId);
  if (!logEntry.event) throw `Event not found for eventId: ${eventId}`;

  const events: calendar_v3.Schema$Event[] = [logEntry.event];

  if (!logEntry.userId) throw new Error(`Missing UserId for event JSON`);

  const user = await fetchUserByMiterId(logEntry.userId);
  // Note that we don't have a foreign key constraint in google_events_log to avoid losing JSON to insertion errors
  if (!user) throw new Error(`User not retrieved for User ID: ${logEntry.userId}`);

  const calendarEvents = await convertGoogleEventsToCalendarEvents(events, logEntry.userId, 'Manual Job: Replay JSON');

  const createdCalendarEvents = await createBulkCalendarEvents(calendarEvents, user);

  if (!createdCalendarEvents || createdCalendarEvents.length === 0) {
    throw `Calendar Event Creation failed for eventID: ${eventId}`;
  }

  console.log(`Created ${createdCalendarEvents.length} calendar events(s)`);

  return createdCalendarEvents;
};
