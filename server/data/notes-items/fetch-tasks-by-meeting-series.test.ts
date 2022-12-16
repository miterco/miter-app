// Note: Generally speaking, we've been testing the Fetch functions directly with test data.

import {
  insertBulkTestCalendarEvents,
  insertTestNoteAndSummaryItem,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {fetchMeeting} from '../meetings-events/fetch-meeting';
import {fetchTasksByMeetingSeries} from './fetch-tasks-by-meeting-series';

// In this particular instance, the data is fairly complicated
// and we've already tested the functions to create it in other places
test('fetchTasksByMeetingSeries', async () => {
  const user1 = await insertTestUser(testName());
  const user2 = await insertTestUser(testName());

  // Set up a series of meetings & summary items with the following characteristics:
  // Meeting 1: 1 Task, 1 Decision, both owned by User1 (event though decision ownsership isn't used yet)
  // Meeting 2: 1 Task owned by User 2
  // Meeting 3: 2 Tasks, 1 owned by User 1, 1 owned by User 2
  // Note on constant names: nonTask01 means "Not a Task, Meeting 0, SummaryItem 1"

  const calendarEvents = await insertBulkTestCalendarEvents(testName(), 3);
  const {summaryItem: task00} = await insertTestNoteAndSummaryItem(
    calendarEvents[0].meetingId,
    `${user1.loginEmail} ${testName()}: Meeting 1`,
    {itemType: 'Task'}
  );
  const {summaryItem: _nonTask01} = await insertTestNoteAndSummaryItem(
    calendarEvents[0].meetingId,
    `${user1.loginEmail} ${testName()}`,
    {itemType: 'Decision'}
  );
  const {summaryItem: task10} = await insertTestNoteAndSummaryItem(
    calendarEvents[1].meetingId,
    `${user2.loginEmail} ${testName()}: Meeting 2`,
    {itemType: 'Task'}
  );
  const {summaryItem: task20} = await insertTestNoteAndSummaryItem(
    calendarEvents[2].meetingId,
    `${user1.loginEmail} ${testName()}: Meeting 3`,
    {itemType: 'Task'}
  );
  const {summaryItem: task21} = await insertTestNoteAndSummaryItem(
    calendarEvents[2].meetingId,
    `${user2.loginEmail} ${testName()}: Meeting 3`,
    {itemType: 'Task'}
  );

  const {meetingSeriesId} = await fetchMeeting(calendarEvents[0].meetingId);

  if (!meetingSeriesId) throw 'Here for TS reasons';
  if (!user1.personId) throw 'Here for TS reasons';

  const allTasks = await fetchTasksByMeetingSeries(meetingSeriesId);
  const user1Tasks = await fetchTasksByMeetingSeries(meetingSeriesId, user1.personId);

  expect(allTasks).toHaveLength(4);
  expect(user1Tasks).toHaveLength(2);

  const allTasksIdList = new Set<string>();
  allTasks.forEach(task => allTasksIdList.add(task.id));

  const user1TasksIdList = new Set<string>();
  user1Tasks.forEach(task => user1TasksIdList.add(task.id));

  expect(allTasksIdList).toContain(task00.id);
  expect(allTasksIdList).toContain(task10.id);
  expect(allTasksIdList).toContain(task20.id);
  expect(allTasksIdList).toContain(task21.id);
  expect(user1TasksIdList).toContain(task00.id);
  expect(user1TasksIdList).toContain(task20.id);
});
