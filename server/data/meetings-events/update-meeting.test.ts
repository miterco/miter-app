import {updateMeeting} from './update-meeting';
import {v4 as uuid} from 'uuid';
import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {fetchMeeting} from './fetch-meeting';

const updatedTitleOnly = 'Updated title only';
const updatedGoalOnly = 'Updated goal only';
const updatedTitleAlongsideGoal = 'Updated title alongside goal';
const updatedGoalAlongsideTitle = 'Updated goal alongside title';

test('Update meeting: wrong UUID', async () => {
  await expect(updateMeeting({id: uuid()})).rejects.toThrow();
});

test('Update meeting: update title only', async () => {
  const meeting = await insertTestMeeting(testName());
  const result = await updateMeeting({id: meeting.id, title: updatedTitleOnly});
  expect(result?.title).toEqual(updatedTitleOnly);
});

test('Update meeting: update goal only', async () => {
  const meeting = await insertTestMeeting(testName());
  const result = await updateMeeting({id: meeting.id, goal: updatedGoalOnly});
  expect(result?.goal).toEqual(updatedGoalOnly);
});

test('Update meeting: update title and goal + fetch double-check', async () => {
  const meeting = await insertTestMeeting(testName());
  const result = await updateMeeting({
    id: meeting.id,
    title: updatedTitleAlongsideGoal,
    goal: updatedGoalAlongsideTitle,
  });
  expect(result?.title).toEqual(updatedTitleAlongsideGoal);
  expect(result?.goal).toEqual(updatedGoalAlongsideTitle);

  // Check via fetch so we hit the DB at least once for extra safety.
  const fetchResult = await fetchMeeting(meeting.id);
  expect(fetchResult?.title).toEqual(updatedTitleAlongsideGoal);
  expect(fetchResult?.goal).toEqual(updatedGoalAlongsideTitle);
});

test('Update meeting: null out title and goal', async () => {
  const meeting = await insertTestMeeting(testName());
  const result = await updateMeeting({id: meeting.id, title: null, goal: null});
  expect(result?.title).toBeNull();
  expect(result?.goal).toBeNull();
});
