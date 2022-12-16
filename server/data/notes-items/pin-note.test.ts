import {createNote} from './create-note';
import {fetchNote} from './fetch-note';
import {pinNote} from './pin-note';
import {fetchSummaryItemByNote} from './fetch-summary-item-by-note';
import {insertTestMeetingAndCalendarEvent, testName} from '../../testing/generate-test-data';
import {ItemType} from 'miter-common/SharedTypes';

const testCore = async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const itemText = 'newNote for Pinning';
  const pinnedItemType: ItemType = 'Decision';
  const targetDate = null;

  const {note} = await createNote({
    meetingId: meeting.id,
    itemText,
    createdBy: null,
    targetDate,
    itemType: 'None',
  });

  // TODO we probably don't need these lines (createNote() oughta cover it) but I'm avoiding too many changes to test
  // logic while also changing the thing it's testing. OK yeah, I'm refactoring but I'm trying to leave the logic alone.
  expect(note.itemText).toBe(itemText);
  const fetchNoteResponseBefore = await fetchNote(note.id);
  expect(fetchNoteResponseBefore.itemText).toBe(itemText);

  const {
    note: pinnedNote,
    summaryItem: returnedSummaryItem,
    summaryItemAlreadyExisted,
  } = await pinNote({
    id: note.id,
    itemType: pinnedItemType,
  });

  expect(pinnedNote.itemType).toBe(pinnedItemType);
  const fetchedItem = await fetchSummaryItemByNote(note.id);
  expect(fetchedItem?.itemText).toBe(itemText);
  expect(fetchedItem?.itemType).toBe(pinnedItemType);

  expect(returnedSummaryItem.id).toBe(fetchedItem?.id);

  return {pinnedNote, pinnedSummaryItem: returnedSummaryItem, summaryItemAlreadyExisted};
};

describe('pinNote', () => {
  it("should set existing note itemType & create summary item when there isn't one", async () => {
    const {summaryItemAlreadyExisted} = await testCore();
    expect(summaryItemAlreadyExisted).toBe(false);
  });

  it('should unpin pinned note and its summary item', async () => {
    const {pinnedNote, pinnedSummaryItem} = await testCore();

    const {
      note: unpinnedNote,
      summaryItem: unpinnedSummaryItem,
      summaryItemAlreadyExisted: unpinnedSummaryItemAlreadyExisted,
    } = await pinNote({id: pinnedNote.id, itemType: 'None'});

    expect(unpinnedNote.itemType).toBe('None');
    expect(unpinnedSummaryItem.itemType).toBe('None');
    expect(unpinnedSummaryItem.id).toBe(pinnedSummaryItem.id);
    expect(unpinnedSummaryItemAlreadyExisted).toBe(true);
  });

  it('should re-pin pinned note and update its summary item', async () => {
    const {pinnedNote, pinnedSummaryItem} = await testCore();

    const {
      note: unpinnedNote,
      summaryItem: unpinnedSummaryItem,
      summaryItemAlreadyExisted: unpinnedSummaryItemAlreadyExisted,
    } = await pinNote({id: pinnedNote.id, itemType: 'Task'});

    expect(unpinnedNote.itemType).toBe('Task');
    expect(unpinnedSummaryItem.itemType).toBe('Task');
    expect(unpinnedSummaryItem.id).toBe(pinnedSummaryItem.id);
    expect(unpinnedSummaryItemAlreadyExisted).toBe(true);
  });
});
