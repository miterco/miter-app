import { fetchMeetingByToken, isTokenValueAvailable } from "./fetch-token";

test('Fetch meeting by token -> Found', async () => {
  const tokenValue = 'VALIDTESTTOKEN';
  const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1581';
  const meeting = await fetchMeetingByToken(tokenValue);
  expect(meeting?.id).toBe(meetingId);

});

test('Fetch meeting by token -> Not Found / Expired', async () => {
  const tokenValue = 'EXPIREDTESTTOKEN';
  const promise = fetchMeetingByToken(tokenValue);
  await expect(promise).rejects.toThrow();
});

test('Fetch meeting by token -> Not Found / Not in Database', async () => {
  const tokenValue = 'NOTINDATABASE';
  const promise = fetchMeetingByToken(tokenValue);
  await expect(promise).rejects.toThrow();
});

test('isTokenAvaible -> Yes / Expired', async () => {
  const tokenValue = 'EXPIREDTESTTOKEN';
  const isAvailable = await isTokenValueAvailable(tokenValue);
  expect(isAvailable).toBeTruthy();

});

test('isTokenAvaible -> Yes / Never Used', async () => {
  const tokenValue = 'NOTINDATABASE';
  const isAvailable = await isTokenValueAvailable(tokenValue);
  expect(isAvailable).toBeTruthy();

});

test('isTokenAvaible -> No / Still Valid', async () => {
  const tokenValue = 'VALIDTESTTOKEN';
  const isAvailable = await isTokenValueAvailable(tokenValue);
  expect(isAvailable).toBeFalsy();
});