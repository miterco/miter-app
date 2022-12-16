import {
  insertTestMeetingAndCalendarEvent,
  insertTestProtocol,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {ItemType, TaskProgressType} from 'miter-common/SharedTypes';
import {createSummaryItem} from './create-summary-item';

const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1580';
const itemText = 'Testing adding a summary item';
const itemType: ItemType = 'Decision';
const createdBy = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const targetDate = null;

describe('createSummaryItem', () => {
  it('should create a summary item with a guest author', async () => {
    const {meeting: newMeeting} = await insertTestMeetingAndCalendarEvent(testName());
    const newTopic = await insertTestTopic(newMeeting.id, 'Topic Text for createSummaryItem');
    const itemText = 'Testing adding a meeting item with topic';

    const newSummaryItem = await createSummaryItem({
      meetingId: newMeeting.id,
      topicId: newTopic.id,
      noteId: null,
      createdBy: null,
      itemText,
      itemType: 'Decision',
      targetDate: null,
    });

    expect(newSummaryItem.itemText).toBe(itemText);

    const newSummaryItem2 = await createSummaryItem({
      meetingId: newMeeting.id,
      noteId: null,
      createdBy: null,
      itemText: 'Testing adding a meeting item No topic',
      itemType: 'Decision',
      targetDate: null,
    });

    expect(newSummaryItem2.topicId).toBeFalsy();
  });

  it('should create a summary item with a user-author', async () => {
    const taskProgress: TaskProgressType = 'Completed';
    const newSummaryItem = await createSummaryItem({
      meetingId,
      noteId: null,
      createdBy,
      itemText,
      itemType,
      taskProgress,
      targetDate,
    });

    expect(newSummaryItem.itemText).toBe(itemText);
    expect(newSummaryItem.createdBy).toEqual(createdBy);
    expect(newSummaryItem.taskProgress).toBe(taskProgress);
  });

  it('should create a task with no attached meeting', async () => {
    const summaryItem = await createSummaryItem({
      meetingId: null,
      noteId: null,
      createdBy,
      itemText,
      itemType: 'Task',
      targetDate,
    });

    expect(summaryItem.itemText).toBe(itemText);
    expect(summaryItem.meetingId).toBeNull();
  });

  it('should fail to create a summary item with no attached meeting if it lacks a creator', async () => {
    const summaryItemPromise = createSummaryItem({
      meetingId: null,
      noteId: null,
      createdBy: null,
      itemText,
      itemType: 'Task',
      targetDate,
    });

    await expect(summaryItemPromise).rejects.toThrow();
  });
});

test('createSummaryItem - Protocol', async () => {
  const systemMessageType = 'Protocol';
  const {protocol} = await insertTestProtocol('protocolName', {phases: ['Phase 1', 'Phase 2']});
  const newSummaryItem = await createSummaryItem({
    meetingId,
    noteId: null,
    createdBy,
    itemType: 'Pin',
    targetDate,
    protocolId: protocol!.id,
    systemMessageType,
  });

  expect(newSummaryItem.createdBy).toEqual(createdBy);
  expect(newSummaryItem.protocolId).toEqual(protocol?.id);
  expect(newSummaryItem.systemMessageType).toBe(systemMessageType);
});
