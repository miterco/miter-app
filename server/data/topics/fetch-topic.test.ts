import { fetchTopic } from "./fetch-topic";

const topicId = '3a738519-fc32-4b61-8732-42fbd5caf67d';
const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1580';
const text = 'Test Topic 1';

test('fetchTopic', async () => {
  const fetchTopicResponse = await fetchTopic(topicId);
  expect(fetchTopicResponse?.meetingId).toBe(meetingId);
  expect(fetchTopicResponse?.text).toBe(text);
  expect(fetchTopicResponse?.order).toBe(1.1);
});

