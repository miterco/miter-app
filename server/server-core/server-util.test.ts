import {parseGoogleEventId} from './server-util';

test('parseGoogleEventId', async () => {
  const googleId = '2hd908k8co98qsnid52o2hovi4_20210420T210000Z';
  const googleIdParts = googleId.split('_');

  const recurringEventId = parseGoogleEventId(googleId);
  expect(recurringEventId?.base).toBe(googleIdParts[0]);
  expect(recurringEventId?.coda).toBe(googleIdParts[1]);
});
