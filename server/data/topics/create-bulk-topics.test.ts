import { insertBulkTestCalendarEvents, insertTestMeeting, insertTestTopic, testName } from '../../testing/generate-test-data';
import { createBulkTopics } from './create-bulk-topics';
import { fetchAllTopicsForMeeting } from './fetch-all-topics';


test('createBulkTopics', async () => {

  const calendarEvents = await insertBulkTestCalendarEvents(testName(), 5);
  const priorCalendarEvent = calendarEvents[2];
  const currentCalendarEvent = calendarEvents[3];

  await insertTestTopic(priorCalendarEvent.meetingId, `${testName()  }1`);
  await insertTestTopic(priorCalendarEvent.meetingId, `${testName()  }2`);
  await insertTestTopic(priorCalendarEvent.meetingId, `${testName()  }3`);

  const topics = await fetchAllTopicsForMeeting(priorCalendarEvent.meetingId);
  await createBulkTopics(currentCalendarEvent.meetingId, topics);

  const copiedTopics = await fetchAllTopicsForMeeting(currentCalendarEvent.meetingId);
  if (!copiedTopics) throw 'Topics not found';

  expect(copiedTopics).toHaveLength(3);

});
