import {Meeting} from '../../../common/SharedTypes';
import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {fetchMeeting} from './fetch-meeting';
import {setZoomMeetingIdentifiers} from './set-zoom-identifiers';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();
const zoomMeetingNID = '1234567890';
const zoomMeetingUID = 'unique_zoom_meeting_id';

describe('setZoomMeetingIdentifiers', () => {
  let meeting: Meeting;
  let updatedMeeting: Meeting;

  beforeAll(async () => {
    meeting = await insertTestMeeting(testName());
    updatedMeeting = await setZoomMeetingIdentifiers(meeting.id, zoomMeetingNID, zoomMeetingUID);
  });

  it('should return the updated meeting', async () => {
    expect(updatedMeeting).not.toBeNull();
    expect(updatedMeeting.id).toBe(meeting.id);
  });

  it('should contain the Zoom meeting IDs in the returned record', async () => {
    expect(updatedMeeting.zoomMeetingId).toBe(zoomMeetingUID);
    expect(updatedMeeting.zoomNumericMeetingId).toBe(zoomMeetingNID);
  });

  it('should update the meeting record in the database', async () => {
    const meetingDbEntry = await fetchMeeting(meeting.id);
    expect(meetingDbEntry?.zoomMeetingId).toBe(zoomMeetingUID);
    expect(meetingDbEntry?.zoomNumericMeetingId).toBe(zoomMeetingNID);
  });

  it('should only update the Zoom meeting UID when no meeting NID is provided', async () => {
    const newZoomMeetingUID = 'some_other_value';
    await setZoomMeetingIdentifiers(meeting.id, undefined, newZoomMeetingUID);
    const updatedMeeting = await fetchMeeting(meeting.id);

    expect(updatedMeeting?.zoomMeetingId).toBe(newZoomMeetingUID);
    expect(updatedMeeting?.zoomNumericMeetingId).toBe(zoomMeetingNID);
  });

  it('should delete the Zoom meeting identifiers if given NULL values', async () => {
    await setZoomMeetingIdentifiers(meeting.id, null, null);
    const updatedMeeting = await fetchMeeting(meeting.id);

    expect(updatedMeeting?.zoomMeetingId).toBeNull();
    expect(updatedMeeting?.zoomNumericMeetingId).toBeNull();
  });

  afterAll(async () => {
    // Clean-up.
    await prisma.meeting.delete({where: {id: meeting.id}});
  });
});
