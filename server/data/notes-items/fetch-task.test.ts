import { fetchTask } from './fetch-task';

test('fetchTask', async () => {
  const taskId = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66b2';
  const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1581';
  const itemText = 'Test Miter - Task 1';
  const itemType = 'Task';

  const task = await fetchTask(taskId);

  expect(task.id).toBe(taskId);
  expect(task.itemText).toBe(itemText);
  expect(task.meetingId).toBe(meetingId);
  expect(task.itemType).toBe(itemType);
});