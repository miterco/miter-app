import {createNote} from './create-note';
import {updateNote} from './update-note';
import {
  insertTestNoteAndSummaryItem,
  insertTestMeetingAndCalendarEvent,
  insertTestTopic,
  testName,
} from '../../testing/generate-test-data';
import {UpdateNoteRequest} from 'miter-common/SharedTypes';
import {fetchSummaryItem} from './fetch-summary-item';
import {fetchItemAssociatedPeople, fetchItemAssociatedPeopleByNote} from '../people/fetch-item-associated-people';

describe('updateNote', () => {
  let meeting: any;
  let calendarEvent: any;

  beforeAll(async () => {
    // Ideally, testing utility functions should retrieve all the records it created.
    ({meeting, calendarEvent} = await insertTestMeetingAndCalendarEvent(testName()));
  });

  afterAll(async () => {
    // TODO Can't delete meetings without dealing with their constraints.
    // await prisma.meeting.delete({where: {id: meeting.id}});
    // await prisma.calendarEvent.delete({where: {id: calendarEvent.id}});
  });

  it('should update the text of a standalone note', async () => {
    const {note: newNote} = await createNote({
      meetingId: meeting.id,
      itemText: testName(),
      createdBy: null,
      targetDate: null,
      itemType: 'None',
    });

    const editedText = 'Updated note';
    const {note: updatedNote, summaryItem: nullSummaryItem} = await updateNote({
      id: newNote.id,
      itemText: editedText,
    });

    expect(updatedNote.itemText).toEqual(editedText);
    expect(nullSummaryItem).toBeNull();
  });

  it('should update the text of a note and its associated summary item', async () => {
    const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, `${new Date()} - ${testName()}`);
    if (!summaryItem.noteId) throw 'TS null check';

    const editedText = `Edited - ${testName()}`;
    const req: UpdateNoteRequest = {id: summaryItem.noteId, itemText: editedText};
    const {note: updatedNote, summaryItem: updatedSummaryItem} = await updateNote(req);
    expect(updatedNote.itemText).toBe(editedText);

    const fetchedSummaryItem = await fetchSummaryItem(summaryItem.id);
    expect(fetchedSummaryItem?.itemText).toBe(editedText);
    expect(updatedNote.itemText).toBe(editedText);
    expect(updatedSummaryItem).toBeTruthy();
    expect(updatedSummaryItem?.itemText).toBe(editedText);
  });

  it('should update the topic of a note and its associated summary item', async () => {
    const text = 'Test Topic for Setting';
    const topic = await insertTestTopic(meeting.id, text);

    const {summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, testName());
    expect(summaryItem?.topicId).toBeFalsy();
    if (!summaryItem.noteId) throw 'TS null check';

    const req: UpdateNoteRequest = {id: summaryItem.noteId, topicId: topic.id};
    const {note: updatedNote, summaryItem: updatedSummaryItem} = await updateNote(req);
    expect(updatedNote.topicId).toBe(topic.id);

    const fetchedSummaryItem = await fetchSummaryItem(summaryItem.id);
    expect(fetchedSummaryItem?.topicId).toBe(topic.id);
    expect(updatedSummaryItem?.id).toBeTruthy();
    expect(fetchedSummaryItem?.id).toBe(updatedSummaryItem?.id);
  });

  it('should add associated people to a note and summary item', async () => {
    const {note, summaryItem} = await insertTestNoteAndSummaryItem(meeting.id, testName());

    const req: UpdateNoteRequest = {id: note.id, itemText: 'test@test.miter.co sampleemailw@test.miter.co'};
    await updateNote(req);
    const noteAssociatedPeople = await fetchItemAssociatedPeopleByNote(note.id);
    expect(noteAssociatedPeople).toHaveLength(2);
    const itemAssociatedPeople = await fetchItemAssociatedPeople(summaryItem.id);
    expect(itemAssociatedPeople).toHaveLength(2);
  });
});
