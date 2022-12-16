import { fetchSummaryItemByNote } from './fetch-summary-item-by-note';

test('fetchSummaryItem', async () => {

    const noteId = 'cc2daf96-1382-49a0-b6e9-d7a7e6adfd5f';
    const fetchedItem = await fetchSummaryItemByNote(noteId);
    expect(fetchedItem?.itemText).toBe("Test Miter - Decision");

});