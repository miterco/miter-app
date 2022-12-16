import {fetchEventJson} from './fetch-event-json';

describe('fetchEventJson', () => {
  it('should return a known row with serviceId, userId, and event as JSON rather than string', async () => {
    const eventJson = await fetchEventJson('sampleevent');

    expect(eventJson.userId).toBe('993093f1-76af-4abb-9bdd-72dfe9ba7b8f');
    expect(eventJson.event.id).toBe('sampleevent');
  });
});
