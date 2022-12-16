import {
  fetchUserByMiterId,
  fetchUserByGoogleId,
  fetchUserByPushChannel,
  fetchUserByLoginEmail,
  fetchUserByZoomId,
} from './fetch-user';

const picture = 'https://lh3.googleusercontent.com/a-/12345';
const googleId = '104169948880648460000';
const miterId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const firstName = 'First';
const lastName = 'Last';
const displayName = 'First Last';
const loginEmail = 'test@test.miter.co';
const channelId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const zoomUserId = '1de4a41d-9fcf-43a3-8e1d-cb12d316dce1';
const userIdForZoomUser = '746f7ff7-f198-429c-bdbe-638812b89878';

test('fetchUserByGoogleId', async () => {
  const fetchUserResponse = await fetchUserByGoogleId(googleId);
  expect(fetchUserResponse?.firstName).toBe(firstName);
  expect(fetchUserResponse?.lastName).toBe(lastName);
  expect(fetchUserResponse?.displayName).toBe(displayName);
  expect(fetchUserResponse?.loginEmail).toBe(loginEmail);
  expect(fetchUserResponse?.picture).toBe(picture);
});

test('fetchUserByZoomId', async () => {
  const user = await fetchUserByZoomId(zoomUserId);

  expect(user?.id).toBe(userIdForZoomUser);
  expect(user?.displayName).toBe('Zoom User');
  expect(user?.loginEmail).toBe('zoom-user@test.miter.co');
  expect(user?.signUpProductSurface).toBe('Unknown');
});

test('fetchUserByMiterId', async () => {
  const fetchUserResponse = await fetchUserByMiterId(miterId);
  expect(fetchUserResponse?.firstName).toBe(firstName);
  expect(fetchUserResponse?.lastName).toBe(lastName);
  expect(fetchUserResponse?.displayName).toBe(displayName);
  expect(fetchUserResponse?.loginEmail).toBe(loginEmail);
  expect(fetchUserResponse?.picture).toBe(picture);
  expect(fetchUserResponse?.signUpProductSurface).toBe('ChromeExtension');
});

test('fetchUserByPushChannelId', async () => {
  const fetchUserResponse = await fetchUserByPushChannel(channelId);
  expect(fetchUserResponse?.loginEmail).toBe(loginEmail);
});

test('fetchUserByLoginEmail', async () => {
  const fetchUserResponse = await fetchUserByLoginEmail(loginEmail);
  expect(fetchUserResponse?.displayName).toBe(displayName);
});
