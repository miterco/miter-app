import {v4 as uuid} from 'uuid';
import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {fetchMeeting} from './fetch-meeting';
import {updateMeetingZoomId} from './update-meeting-zoom-id';

const zoomMeetingId = uuid();

test('updateMeetingZoomId: wrong meeting ID', async () => {
  await expect(updateMeetingZoomId(uuid(), null)).rejects.toThrow();
});

test('updateMeetingZoomId: correct meeting ID', async () => {
  const meeting = await insertTestMeeting(testName());
  const result = await updateMeetingZoomId(meeting.id, zoomMeetingId);

  // It should return the updated meeting.
  expect(result?.zoomMeetingId).toEqual(zoomMeetingId);

  // It should store the new ID in the database.
  const meetingRecord = await fetchMeeting(meeting.id);
  expect(meetingRecord?.zoomMeetingId).toEqual(zoomMeetingId);
});
