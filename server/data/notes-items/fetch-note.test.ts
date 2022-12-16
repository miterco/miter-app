import { fetchNote } from './fetch-note';

const topicId = '3a738519-fc32-4b61-8732-42fbd5caf67d';
const itemText = 'This is a note';

test('fetchNote', async () => {
    const fetchNoteResponse = await fetchNote('cc2daf96-1382-49a0-b6e9-d7a7e6adfd5f');
    expect(fetchNoteResponse.itemText).toBe(itemText);
    expect(fetchNoteResponse?.topicId).toEqual(topicId);
    expect(fetchNoteResponse).toHaveProperty('id');
});
