import {Meeting} from 'miter-common/SharedTypes';
import {
  insertMultipleTestSummaryItems,
  insertTestMeeting,
  insertTestSummaryItem,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {addMeetingAttendee} from '../people/add-meeting-attendee';
import {getPrismaClient} from '../prisma-client';
import {fetchTasksByPerson, fetchTasksByPersonMeetings} from './fetch-tasks-by-person';

// Useful objects already in test data
const topicId = '330da00c-1ddd-42fa-b505-bfdc2f7ce0e2';

const prisma = getPrismaClient();

let meeting1: Meeting;
let meeting2: Meeting;
let personId: string;

/*
 * Generate test data to cover all these tests
 */
beforeAll(async () => {
  // Insert test user
  const user = await insertTestUser('Fetch Tasks User');
  personId = user.personId || '';

  // Insert two meetings for us to work with
  meeting1 = await insertTestMeeting('Test Meeting 1 for Fetch Tasks');
  meeting2 = await insertTestMeeting('Test Meeting 2 for Fetch Tasks');

  // Add the test user as an attendee on both
  await addMeetingAttendee(meeting1.id, user.id);
  await addMeetingAttendee(meeting2.id, user.id);

  // Three completed tasks with topics
  await insertMultipleTestSummaryItems('Completed Task', 3, {
    meetingId: meeting1.id,
    topicId,
    createdBy: user.id,
    taskProgress: 'Completed',
  });

  // Two incomplete tasks without topics
  await insertMultipleTestSummaryItems('Incomplete Task', 2, {
    createdBy: user.id,
    meetingId: meeting2.id,
  });
});

describe('fetchTasksByPerson', () => {
  it('should return all tasks for a person when no filter is supplied', async () => {
    const tasks = await fetchTasksByPerson(personId);

    expect(tasks).toHaveLength(5);
    expect(tasks[0].summaryItem.itemOwnerId).toBe(personId);
    expect(tasks[0].topic?.id).toBe(topicId);
    expect(tasks[0].owner?.id).toBe(personId);
  });

  it('should return only incomplete tasks when filtered as such', async () => {
    const tasks = await fetchTasksByPerson(personId, 'None');

    expect(tasks).toHaveLength(2);
    expect(tasks[0].summaryItem.taskProgress).toBe('None');
    expect(tasks[1].summaryItem.taskProgress).toBe('None');
    expect(tasks[0].owner?.id).toBe(personId);
  });

  it('should not return tasks for a template meeting', async () => {
    const testUser = await insertTestUser('Template-Task User');
    const templateMeeting = await insertTestMeeting(`Template Meeting ${Date.now()}`);
    const regularMeeting = await insertTestMeeting(`Regular Meeting ${Date.now()}`);

    await insertTestSummaryItem(templateMeeting.id, testName(), {itemType: 'Task', createdBy: testUser.id});
    const regularTask = await insertTestSummaryItem(regularMeeting.id, testName(), {
      itemType: 'Task',
      createdBy: testUser.id,
    });

    // Turn the meeting into a template.
    await prisma.meeting.update({
      where: {id: templateMeeting.id},
      data: {isTemplate: true},
    });

    const tasks = await fetchTasksByPerson(testUser.personId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].summaryItem.id).toBe(regularTask.id);
  });

  it('should return standalone tasks alongside meeting ones', async () => {
    const testUser = await insertTestUser('Standalone Task Test User');
    const meeting = await insertTestMeeting(testName());
    await insertTestSummaryItem(meeting.id, testName(), {createdBy: testUser.id, itemType: 'Task'});
    const standaloneTask = await insertTestSummaryItem(null, `Test Standalone Task ${Date.now()}`, {
      createdBy: testUser.id,
      itemType: 'Task',
    });

    const tasks = await fetchTasksByPerson(testUser.personId);
    expect(tasks).toHaveLength(2);
    const includesStandaloneTask = tasks.some(({summaryItem}) => summaryItem.id === standaloneTask.id);
    expect(includesStandaloneTask).toBe(true);
  });
});

describe('fetchTasksByPersonMeetings', () => {
  it("should return tasks for all a person's meetings when not filtered", async () => {
    const tasks = await fetchTasksByPersonMeetings(personId);
    expect(tasks).toHaveLength(5);

    const fetchedMeetingTitles = new Set<string>();
    tasks.forEach(task => {
      expect(task.meeting?.title).toBeTruthy();
      expect(task.owner?.id).toBe(personId);
      if (task.meeting?.title) fetchedMeetingTitles.add(task.meeting.title);
    });

    expect(fetchedMeetingTitles.size).toBe(2);
    expect(fetchedMeetingTitles).toContain(meeting1.title);
    expect(fetchedMeetingTitles).toContain(meeting2.title);
  });

  it('should fetch only incomplete tasks when filtered', async () => {
    const tasks = await fetchTasksByPersonMeetings(personId, 'None');
    expect(tasks).toHaveLength(2);

    const fetchedMeetingTitles = new Set<string>();
    tasks.forEach(task => {
      expect(task.meeting?.title).toBeTruthy();
      expect(task.owner?.id).toBe(personId);
      if (task.meeting?.title) fetchedMeetingTitles.add(task.meeting.title);
    });

    expect(fetchedMeetingTitles.size).toBe(1);
    expect(fetchedMeetingTitles).toContain(meeting2.title);
  });
});
