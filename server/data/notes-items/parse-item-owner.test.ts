import {insertTestUser, testName} from '../../testing/generate-test-data';
import {parseItemOwner} from './parse-item-owner';

test('parseItemOwner - Starts with an email', async () => {
  const user = await insertTestUser(testName());
  const createdBy = user.personId;
  const testPersonId = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';

  const itemText = 'test@test.miter.co    xxx';

  const {owner, explicit} = await parseItemOwner({itemText, createdBy});

  expect(owner?.id).toBe(testPersonId);
  expect(explicit).toBe(true);
});

test('parseItemOwner - Does not start with an email', async () => {
  const user = await insertTestUser(testName());
  const createdBy = user.id;

  const itemText = 'xxx test@test.miter.co';

  const {owner, explicit} = await parseItemOwner({itemText, createdBy});

  expect(owner?.id).toBe(user.personId);
  expect(explicit).toBe(false);
});

test('parseItemOwner - contains no emails', async () => {
  const user = await insertTestUser(testName());
  const createdBy = user.id;

  const itemText = 'Has anyone seen my keys?';

  const {owner, explicit} = await parseItemOwner({itemText, createdBy});

  expect(owner?.id).toBe(user.personId);
  expect(explicit).toBe(false);
});
