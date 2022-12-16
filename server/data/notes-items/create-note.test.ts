import {uuid} from 'miter-common/CommonUtil';
import {ItemType, Meeting, Note, SystemMessageType} from 'miter-common/SharedTypes';
import {
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {createNote, createSystemMessage} from './create-note';
import {fetchSummaryItemByNote} from './fetch-summary-item-by-note';

const CreatedBy = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';

const testCore = async (
  noteContent: Partial<Note>,
  shouldCreateSummaryItem: boolean = false,
  specifyMeeting?: Meeting
) => {
  const meeting = specifyMeeting || (await insertTestMeetingAndCalendarEvent(testName())).meeting;
  const {topicId} = noteContent;
  const createdBy = noteContent.createdBy !== undefined ? noteContent.createdBy : CreatedBy;
  const itemText = noteContent.itemText || testName();
  const itemType = noteContent.itemType || 'None';
  const targetDate = noteContent.targetDate || null;

  const {note, summaryItem} = await createNote({
    meetingId: meeting.id,
    topicId,
    createdBy,
    itemText,
    itemType,
    targetDate,
  });

  if (shouldCreateSummaryItem) expect(summaryItem).toBeTruthy();
  else expect(summaryItem).toBeFalsy();

  expect(note.createdBy).toBe(createdBy);

  return {note, summaryItem};
};

describe('createNote', () => {
  it('should insert a note with specified topic and creator', async () => {
    const itemTextWithTopic = `newNote with a topic ${uuid()}`;

    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
    const topic = await insertTestTopic(meeting.id, 'Test Topic for new note');

    const {note} = await testCore({topicId: topic.id, itemText: itemTextWithTopic}, false, meeting);

    expect(note.itemText).toBe(itemTextWithTopic);
    expect(note.topicId).toBe(topic.id);
  });

  it('should insert a note with neither topic nor creator', async () => {
    const itemTextNoTopic = 'newNote without a topic';
    const {note} = await testCore({itemText: itemTextNoTopic, createdBy: null});
    expect(note.itemText).toBe(itemTextNoTopic);
    expect(note.createdBy).toBeFalsy(); // Duplicates testCore() but double-checking its logic this way
    expect(note.topicId).toBeFalsy();
  });

  it('should insert a note with a creator but no topic', async () => {
    const itemText = 'Create Note - User Author';
    const {note} = await testCore({itemText});
    expect(note.itemText).toBe(itemText);
    expect(note.createdBy).toBe(CreatedBy);
    expect(note.topicId).toBeFalsy();
  });

  it('should create both note and summary item when ItemType is not None', async () => {
    const itemText = 'Create Note - User Author';
    const itemType = 'Decision';

    const {note, summaryItem} = await testCore({itemText, itemType}, true);

    expect(note.itemText).toBe(itemText);
    expect(note.createdBy).toEqual(CreatedBy);

    const item = await fetchSummaryItemByNote(note.id);
    expect(item).toBeTruthy();
    expect(item?.itemText).toBe(itemText);
    expect(item?.itemType).toBe(itemType);
    expect(item?.id).toBe(summaryItem?.id);
  });

  it('should auto-convert a new note starting with an email into an assigned task', async () => {
    const user = await insertTestUser(testName());
    const assignee = await insertTestUser(testName());

    const {note, summaryItem} = await testCore(
      {
        itemText: `${assignee.loginEmail} needs to find my keys`,
        createdBy: user.id,
      },
      true
    );

    expect(note.itemType).toBe('Task');
    expect(note.ownerId).toBe(assignee.personId);

    // Did we get a summary item too?
    const item = await fetchSummaryItemByNote(note.id);
    expect(item).toBeTruthy();
    expect(item?.itemType).toBe('Task');
    expect(item?.itemOwnerId).toBe(assignee.personId);
    expect(item?.id).toBe(summaryItem?.id);
  });
});

describe('createSystemMessage', () => {
  it('should create a change-topic system message', async () => {
    const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
    const user = await insertTestUser(testName());
    const topic = await insertTestTopic(meeting.id, testName());

    const systemMessageType: SystemMessageType = 'CurrentTopicSet';
    const itemType: ItemType = 'None';
    const itemText = '';

    const newNote = await createSystemMessage({
      systemMessageType,
      meetingId: meeting.id,
      createdBy: user.id,
      topicId: topic.id,
    });

    expect(newNote.id).toBeTruthy();
    expect(newNote.systemMessageType).toBe(systemMessageType);
    expect(newNote.itemText).toBe(itemText);
    expect(newNote.itemType).toBe(itemType);
    expect(newNote.createdBy).toBe(user.id);
    expect(newNote.topicId).toBe(topic.id);
  });
});
