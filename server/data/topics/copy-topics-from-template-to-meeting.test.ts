import {insertTestMeeting, insertTestTopic, testName} from '../../testing/generate-test-data';
import {fetchMeeting} from '../meetings-events/fetch-meeting';
import {fetchTemplate} from '../meetings-events/fetch-template';
import {fetchAllNotes} from '../notes-items/fetch-all-notes';
import {fetchAllSummaryItems} from '../notes-items/fetch-all-summary-items';
import {copyTopicsFromTemplateToMeeting} from './copy-topics-from-template-to-meeting';
import {fetchAllTopicsForMeeting} from './fetch-all-topics';

const templateId = '3183c778-4642-462b-a5b6-14756c1220b9';

describe('copyTopicsFromTemplateToMeeting', () => {
  // We don't usually check this because Prisma generally does this for us, but this is a more complex operation
  // Note that this only checks that we can rely on the objects being sent back to match DB so we can use them in tests below
  it('should return the same objects as are present in the database (when copying only Topics)', async () => {
    const meeting = await insertTestMeeting(testName());
    const {meeting: updatedMeeting, topics, notes} = await copyTopicsFromTemplateToMeeting(templateId, meeting.id);

    const meetingInDatabase = await fetchMeeting(meeting.id);
    const topicsInDatabase = await fetchAllTopicsForMeeting(meeting.id);
    const notesInDatabase = await fetchAllNotes(meeting.id);

    expect(updatedMeeting).toEqual(meetingInDatabase);
    expect(topics).toEqual(topicsInDatabase);
    expect(notes).toEqual(notesInDatabase);
  });

  // Potentially different logic so we check both without and with copyNotes flag
  it('should return the same objects as are present in the database (when copying Topics & Notes)', async () => {
    const meeting = await insertTestMeeting(testName());
    const {
      meeting: updatedMeeting,
      topics,
      notes,
    } = await copyTopicsFromTemplateToMeeting(templateId, meeting.id, true);

    const meetingInDatabase = await fetchMeeting(meeting.id);
    const topicsInDatabase = await fetchAllTopicsForMeeting(meeting.id);
    const notesInDatabase = await fetchAllNotes(meeting.id);

    expect(updatedMeeting).toEqual(meetingInDatabase);
    expect(topics).toEqual(topicsInDatabase);
    expect(notes).toEqual(notesInDatabase);
  });

  it('should copy Topics Only from the template to a meeting with no objects on it (copyNotes = false)', async () => {
    const meeting = await insertTestMeeting(testName());
    const {meeting: updatedMeeting, topics, notes} = await copyTopicsFromTemplateToMeeting(templateId, meeting.id);

    const template = await fetchTemplate(templateId);

    expect(updatedMeeting.id).toBe(meeting.id);
    expect(updatedMeeting.goal).toBe(template.goal);

    expect(topics).toHaveLength(3);
    expect(topics[0].text).toBe('Test Topic 1');
    expect(topics[1].text).toBe('Test Topic 2');
    expect(topics[2].text).toBe('Test Topic 3');

    expect(notes).toEqual([]);
  });

  it('should copy Topics AND Notes from the template to a meeting with no objects on it (copyNotes = true)', async () => {
    const meeting = await insertTestMeeting(testName());
    const {
      meeting: updatedMeeting,
      topics,
      notes,
    } = await copyTopicsFromTemplateToMeeting(templateId, meeting.id, true);

    const template = await fetchTemplate(templateId);

    expect(updatedMeeting.id).toBe(meeting.id);
    expect(updatedMeeting.goal).toBe(template.goal);
    expect(topics).toHaveLength(3);
    expect(topics[0].text).toBe('Test Topic 1');
    expect(topics[1].text).toBe('Test Topic 2');
    expect(topics[2].text).toBe('Test Topic 3');

    expect(notes).toHaveLength(6);
    expect(notes[0].topicId).toBe(topics[0].id);
    expect(notes[1].topicId).toBe(topics[0].id);
    expect(notes[2].topicId).toBe(topics[1].id);
  });

  it('should create summary items if the note is also a summary item', async () => {
    const meeting = await insertTestMeeting(testName());
    const {topics, notes} = await copyTopicsFromTemplateToMeeting(templateId, meeting.id, true);

    const summaryItems = await fetchAllSummaryItems(meeting.id);

    expect(notes).toHaveLength(6);
    expect(notes[3].topicId).toBe(topics[2].id);
    expect(notes[4].topicId).toBe(topics[2].id);
    expect(notes[5].topicId).toBe(topics[2].id);

    expect(summaryItems).toHaveLength(3);
    expect(summaryItems[0].topicId).toBe(topics[2].id);
    expect(summaryItems[1].topicId).toBe(topics[2].id);
    expect(summaryItems[2].topicId).toBe(topics[2].id);
  });

  it('should fail if the meeting already has content', async () => {
    const meeting = await insertTestMeeting(testName());
    await insertTestTopic(meeting.id, testName());

    const promise = copyTopicsFromTemplateToMeeting(templateId, meeting.id, true);
    await expect(promise).rejects.toThrow();
  });
});
