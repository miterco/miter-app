import { fetchSummaryItem } from './fetch-summary-item';

test('fetchSummaryItem', async () => {
    const summaryItemId = '0213b5ec-b3d5-44d9-b64f-4adbfa7b66ae';
    const topicId = '3a738519-fc32-4b61-8732-42fbd5caf67d';

    const fetchedItem = await fetchSummaryItem(summaryItemId);
    expect(fetchedItem?.itemText).toBe("Test Miter - Decision");
    expect(fetchedItem?.topicId).toBe(topicId);

});