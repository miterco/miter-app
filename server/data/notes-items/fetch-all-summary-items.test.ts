import { fetchAllSummaryItems } from './fetch-all-summary-items';

test('fetchAllSummaryItems', async () => {

    const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1581';

    const fetchAllSummaryItemsResponse = await fetchAllSummaryItems(meetingId);
    expect(fetchAllSummaryItemsResponse?.length).toBe(4);

});