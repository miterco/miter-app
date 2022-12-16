import { fetchActiveUsers } from "./fetch-active-users";

test('FetchActiveUsers', async () => {

  const activeUsers = await fetchActiveUsers();
  expect(activeUsers.length).toBeGreaterThanOrEqual(3);
});