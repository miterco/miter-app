import * as gCal from '../google-apis/google-calendar';
import {editGoogleIdentifiers} from '../data/edit-google-identifiers';
import {createBulkCalendarEvents} from '../data/meetings-events/create-bulk-calendar-events';
import {fetchUserByPushChannel} from '../data/people/fetch-user';
import httpEndpoint from '../server-core/http/http-endpoint';
import {UserRecord} from '../server-core/server-types';

export const gcalHookEndpoint = httpEndpoint(async (req, res) => {
  // Google doesn't expect anything back from us, so respond quickly and then proceed.
  res.json({});

  // Logging
  console.log(
    `GCal Push - Channel: ${req.headers['x-goog-channel-id']} - Resource: ${req.headers['x-goog-resource-id']} - Expires: ${req.headers['x-goog-channel-expiration']} - Resource_State: ${req.headers['x-goog-resource-state']}`
  );

  // Validate incoming headers
  const channelId = req.headers['x-goog-channel-id'];
  const resourceState = req.headers['x-goog-resource-state'];
  if (typeof channelId === 'string' && typeof resourceState === 'string') {
    if (resourceState === 'sync') {
      // First message we get after setting up the channel. We don't use this right now.
      return;
    }

    let channelUser: UserRecord | null = null;

    try {
      channelUser = await fetchUserByPushChannel(channelId);
      const eventsResult = await gCal.getChangedEventsForChannel(channelId);

      if (eventsResult) {
        editGoogleIdentifiers(eventsResult.userId, {gcalSyncToken: eventsResult.syncToken}); // Don't need return value, not awaiting

        const calendarEventsToSave = await gCal.convertGoogleEventsToCalendarEvents(
          eventsResult.events,
          eventsResult.userId,
          'GCal Hook Endpoint (GCal Push)'
        );
        createBulkCalendarEvents(calendarEventsToSave, channelUser);
      }
    } catch (err: any) {
      // (410) Sync token is no longer valid, a full sync is required.
      if (channelUser && Number(err?.code) === 410) {
        await gCal.renewSyncToken(channelUser);
      } else {
        console.error(err);
      }
    }
  } else {
    console.error('Received a GCal push notification without a channel ID.');
  }
});
