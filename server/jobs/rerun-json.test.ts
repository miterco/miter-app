import {rerunJson} from './rerun-json';

describe('rerunJson', () => {
  it('should run an already existing JSON from google_event_log', async () => {
    const rerunCalendarEvent = await rerunJson('sampleevent');
    expect(rerunCalendarEvent).toHaveLength(1);
  });
});
