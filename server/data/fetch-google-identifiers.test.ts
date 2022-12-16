import { fetchGoogleIdentifiers, fetchGoogleIdentifiersByChannelId } from './fetch-google-identifiers';

const testUserId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const testChannelId ='993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const testResourceId = "ret08u3rv24htgh289g";
const testSyncToken = "CPDAlvWDx70CEPDAlvWDx70CGAU";

test('Fetch Google Identifiers', async () => {
    const fetchUserResponse = await fetchGoogleIdentifiers(testUserId);
    expect(fetchUserResponse?.gcalPushChannel).toBe(testChannelId);
    expect(fetchUserResponse?.gcalResourceId).toBe(testResourceId);
    expect(fetchUserResponse?.gcalSyncToken).toBe(testSyncToken);
});

test('Fetch Identifiers by Channel', async () => {
    const fetchUserResponse = await fetchGoogleIdentifiersByChannelId(testChannelId);
    expect(fetchUserResponse?.id).toBe(testUserId);
    expect(fetchUserResponse?.gcalResourceId).toBe(testResourceId);
    expect(fetchUserResponse?.gcalSyncToken).toBe(testSyncToken);
});
