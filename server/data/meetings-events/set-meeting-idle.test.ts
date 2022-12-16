import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {setMeetingIdle} from './set-meeting-idle';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

const testHelper = async (meetingId: string, newValue: boolean) => {
  const lowerDateBound = new Date().getTime();
  await setMeetingIdle(meetingId, newValue);
  const upperDateBound = new Date().getTime();

  const meeting = await prisma.meeting.findUnique({where: {id: meetingId}});
  if (newValue) {
    expect(meeting?.idleDate?.getTime()).toBeGreaterThanOrEqual(lowerDateBound);
    expect(meeting?.idleDate?.getTime()).toBeLessThanOrEqual(upperDateBound);
  } else {
    expect(meeting?.idleDate).toBeNull();
  }
};

test('setEveryoneLeftMeeting: new meeting, everyone leaves', async () => {
  const {id} = await insertTestMeeting(testName());
  await testHelper(id, true);
});

test('setEveryoneLeftMeeting: new meeting, set false (no-op)', async () => {
  const {id} = await insertTestMeeting(testName());
  await testHelper(id, false);
});

test('setEveryoneLeftMeeting: somebody came back', async () => {
  const {id} = await insertTestMeeting(testName());
  await setMeetingIdle(id, true);
  testHelper(id, false);
});

test('setEveryoneLeftMeeting: leave, rejoin, leave', async () => {
  const {id} = await insertTestMeeting(testName());
  await setMeetingIdle(id, true);
  await setMeetingIdle(id, false);
  testHelper(id, true);
});
