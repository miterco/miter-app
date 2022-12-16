import { fetchUsersWithExpiringPushChannels } from "./fetch-users-with-expiring-push-channels";

const usersWithExpiringPushChannel = [
  '993093f1-76af-4abb-9bdd-72dfe9ba7b8f',
];

test('fetchUserWithExpiringPushChannels', async () => {

  const result = await fetchUsersWithExpiringPushChannels();

  if (!result || result.length === 0) throw ("No results returned");

  const userIds = result.map(user => user.id);

  expect(result.length).toBeGreaterThan(1);
  expect(userIds).toEqual(expect.arrayContaining(usersWithExpiringPushChannel));
});
