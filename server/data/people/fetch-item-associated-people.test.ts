import { fetchItemAssociatedPeople, fetchItemAssociatedPeopleByNote } from "./fetch-item-associated-people";


test('fetchItemAssociatedPeople', async () => {

  const summaryItemId = 'a4dcb32a-6b77-48c0-addf-83a2a49d2a01';
  const personId = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';
  const personEmailId = 'efed2c50-530e-4d05-bf55-fa08a89d0f90';
  const noteId = 'b4eefb30-0c33-440f-bf8c-86122b4a670e';

  const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItemId);
  expect(itemAssociatedPeople).toHaveLength(1);
  expect(itemAssociatedPeople[0].summaryItemId).toBe(summaryItemId);
  expect(itemAssociatedPeople[0].personId).toBe(personId);
  expect(itemAssociatedPeople[0].personEmailId).toBe(personEmailId);
  expect(itemAssociatedPeople[0].noteId).toBe(noteId);

});

test('fetchItemAssociatedPeopleByNote', async () => {

  const summaryItemId = 'a4dcb32a-6b77-48c0-addf-83a2a49d2a01';
  const personId = '7e10bb4a-ddcb-4c54-9e85-b522cf393ce3';
  const personEmailId = 'efed2c50-530e-4d05-bf55-fa08a89d0f90';
  const noteId = 'b4eefb30-0c33-440f-bf8c-86122b4a670e';

  const itemAssociatedPeople = await fetchItemAssociatedPeopleByNote(noteId);
  expect(itemAssociatedPeople).toHaveLength(1);
  expect(itemAssociatedPeople[0].summaryItemId).toBe(summaryItemId);
  expect(itemAssociatedPeople[0].personId).toBe(personId);
  expect(itemAssociatedPeople[0].personEmailId).toBe(personEmailId);
  expect(itemAssociatedPeople[0].summaryItemId).toBe(summaryItemId);

});