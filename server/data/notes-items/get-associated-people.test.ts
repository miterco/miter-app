import {getAssociatedPeople} from './get-associated-people';

test('getAssociatedPeople - Implicit single person', async () => {
  const email = 'test@test.miter.co';
  const displayName = 'First Last';
  const itemText = 'This note contains no people';
  const id = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';
  const emailAddressId = 'efed2c50-530e-4d05-bf55-fa08a89d0f90';

  const result = await getAssociatedPeople({itemText});
  expect(result).toHaveLength(0);
});

test('getAssociatedPeople - Explicit single person', async () => {
  const email = 'test@test.miter.co';
  const displayName = 'First Last';
  const itemText = 'This note contains @test@test.miter.co xxx';
  const id = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';
  const emailAddressId = 'efed2c50-530e-4d05-bf55-fa08a89d0f90';

  const result = await getAssociatedPeople({itemText});
  expect(result).toHaveLength(1);

  expect(result[0].displayName).toBe(displayName);
  expect(result[0].emailAddressId).toBe(emailAddressId);
  expect(result[0].email).toBe(email);
  expect(result[0].id).toBe(id);
});

test('getAssociatedPeople - Two people', async () => {
  const email1 = 'test@test.miter.co';
  const email2 = 'sampleemailw@test.miter.co';
  const itemText = 'This note contains @test@test.miter.co and sampleemailw@test.miter.co xxx';

  const result = await getAssociatedPeople({itemText});
  expect(result).toHaveLength(2);

  expect(result[0].email).toBe(email1);
  expect(result[1].email).toBe(email2);
});
