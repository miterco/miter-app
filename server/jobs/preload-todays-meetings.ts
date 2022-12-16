import {createBulkCalendarEvents} from '../data/meetings-events/create-bulk-calendar-events';
import {fetchActiveUsers} from '../data/people/fetch-active-users';
import {convertGoogleEventsToCalendarEvents, getSingleEventsInWindow} from '../google-apis/google-calendar';
import {UnsavedCalendarEventWithAttendees} from '../server-core/server-types';

const startOffset = 0;
const endOffset = 2;

const runEventLoop = async () => {
  const eventsToSave: UnsavedCalendarEventWithAttendees[] = [];
  const users = await fetchActiveUsers();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      // TODO: run in parallel? Let's see what peformance is like first. d
      const eventsResult = await getSingleEventsInWindow(user.id, startOffset, endOffset, null);
      eventsToSave.push(
        ...(await convertGoogleEventsToCalendarEvents(eventsResult, user.id, 'Batch Job: Preload Todays Meetings'))
      );
    } catch {
      console.log(`User ID: ${user} is missing access tokens. Ignoring for bulk load operation`);
    }
    await createBulkCalendarEvents(eventsToSave, user);
  }

  process.exit();
};

runEventLoop();
