import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {fetchTemplate} from './fetch-template';

const templateId = '3183c778-4642-462b-a5b6-14756c1220b9';

describe('fetch-template', () => {
  it('should find an existing template', async () => {
    const template = await fetchTemplate(templateId);

    expect(template.id).toBe(templateId);
    expect(template.isTemplate).toBe(true);
    expect(template.goal).toBe('Here for the copying');
    expect(template.title).toBe('Meeting Template');
  });
  it('should error if presented with a meeting ID', async () => {
    const meeting = await insertTestMeeting(testName());
    const promise = fetchTemplate(meeting.id);
    await expect(promise).rejects.toThrow();
  });
});
