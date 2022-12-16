import {getPrismaClient} from '../prisma-client';
import {insertTestMeeting, insertTestNote, insertTestTopic, testName} from '../../testing/generate-test-data';
import {createSystemMessage} from './create-note';
import {fetchAllNotes} from './fetch-all-notes';
import {deleteNote} from './delete-note';
import {deleteTopic} from '../topics/delete-topic';

const prisma = getPrismaClient();

describe('fetchAllNotes', () => {
  it('should fetch all the notes for a preexisting meeting in the test DB', async () => {
    const meetingId = '829f99b8-e398-436b-8552-8ee778def54b';
    const itemText = 'This is a note (1/2)';
    const fetchAllNotesResponse = await fetchAllNotes(meetingId);
    expect(fetchAllNotesResponse?.length).toBe(2);
    expect(fetchAllNotesResponse[0].itemText).toBe(itemText);
  });

  it('should omit system notes when requested to do so', async () => {
    const meeting = await insertTestMeeting(testName());
    const topic = await insertTestTopic(meeting.id, 'My Topic');

    // Three regular notes, two topic-change system messages
    const note1 = await insertTestNote(meeting.id, 'This is a note (1/3)');
    const note2 = await insertTestNote(meeting.id, 'This is a note (2/3)');
    const note3 = await createSystemMessage({
      meetingId: meeting.id,
      topicId: topic.id,
      systemMessageType: 'CurrentTopicSet',
    });
    const note4 = await insertTestNote(meeting.id, 'This is a note (3/3)');
    const note5 = await createSystemMessage({
      meetingId: meeting.id,
      topicId: topic.id,
      systemMessageType: 'CurrentTopicSet',
    });

    const fetchAllNotesResponse = await fetchAllNotes(meeting.id, true);
    expect(fetchAllNotesResponse?.length).toBe(3);
    expect(fetchAllNotesResponse[0].id).toBe(note1.id);
    fetchAllNotesResponse.forEach(note => expect(note.id).not.toBe(note3.id));

    // Clean up
    await deleteNote(note1.id);
    await deleteNote(note2.id);
    await deleteNote(note3.id);
    await deleteNote(note4.id);
    await deleteNote(note5.id);
    await deleteTopic(topic.id);
    await prisma.meeting.delete({where: {id: meeting.id}});
  });
});
