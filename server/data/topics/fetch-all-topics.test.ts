import { fetchAllTopicsForMeeting } from './fetch-all-topics';

const topicId0 = '3a738519-fc32-4b61-8732-42fbd5caf67d';
const topicId1 = '330da00c-1ddd-42fa-b505-bfdc2f7ce0e2';
const topicId2 = 'e030f9d9-bc7a-4e9b-b9f3-d086ce3f92d5';

const text0 = 'Test Topic 1';
const order0 = 1.1;

test("fetchAllTopics - no topics yet", async () => {
  const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1581';
  const topics = await fetchAllTopicsForMeeting(meetingId);
  if (!topics) throw "Expected non-falsy result from fetchAllTopicsForMeeting()";
  if (!(topics.length === 0)) throw "Expected an empty topic array.";
});

test("fetchAllTopics - has topics", async () => {
  const meetingId = '1e77370b-535b-4955-96b1-64fe3ebe1580';
  const topics = await fetchAllTopicsForMeeting(meetingId);
  if (!topics) throw "Expected non-falsy result from fetchAllTopicsForMeeting()";
  if (!(topics.length === 3)) throw "Expected 3 topics";

  expect(topics[0].id).toBe(topicId0);
  expect(topics[1].id).toBe(topicId1);
  expect(topics[2].id).toBe(topicId2);

  expect(topics[0].meetingId).toBe(meetingId);
  expect(topics[0].text).toBe(text0);
  expect(topics[0].order).toBe(order0);

});
