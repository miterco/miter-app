import {MeetingPhase} from 'miter-common/SharedTypes';
import {insertTestMeeting, testName} from '../../testing/generate-test-data';
import {getPrismaClient} from '../prisma-client';
import {fetchStaleMeetings} from './fetch-stale-meetings';

const prisma = getPrismaClient();

const dateFromMinuteOffset = (minuteOffset: number) => {
  return new Date(new Date().getTime() + minuteOffset * 60 * 1000);
};

// Args are staleness date, phase meeting is in, and expected staleness result
const testFactory = (data: [Date | null, MeetingPhase, boolean][]) => async () => {
  const insertedMeetingIds: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const [idleDate, phase] = data[i];
    const {id} = await insertTestMeeting(testName());
    await prisma.meeting.update({where: {id}, data: {idleDate, phase}});
    insertedMeetingIds.push(id);
  }
  const stale = await fetchStaleMeetings();
  for (let i = 0; i < data.length; i++) {
    const [_idleDate, _phase, expectStale] = data[i];
    if (expectStale) {
      expect(stale).toEqual(expect.arrayContaining([expect.objectContaining({id: insertedMeetingIds[i]})]));
    } else expect(stale).toEqual(expect.not.arrayContaining([expect.objectContaining({id: insertedMeetingIds[i]})]));
  }
};

test('fetchStaleMeetings - not idle, in progress', testFactory([[null, 'InProgress', false]]));
test('fetchStaleMeetings - not idle, not started', testFactory([[null, 'NotStarted', false]]));
test('fetchStaleMeetings - single 5m ago', testFactory([[dateFromMinuteOffset(-5), 'InProgress', false]]));
test(
  'fetchStaleMeetings - single 30m ago, in progress',
  testFactory([[dateFromMinuteOffset(-30), 'InProgress', true]])
);
test(
  'fetchStaleMeetings - single 30m ago, not started',
  testFactory([[dateFromMinuteOffset(-30), 'NotStarted', false]])
);
test('fetchStaleMeetings - single 30m ago, ended', testFactory([[dateFromMinuteOffset(-30), 'NotStarted', false]]));

test(
  'fetchStaleMeetings - multiple',
  testFactory([
    [dateFromMinuteOffset(-1), 'InProgress', false],
    [dateFromMinuteOffset(-2880), 'InProgress', true],
    [dateFromMinuteOffset(-2880), 'NotStarted', false],
    [null, 'InProgress', false],
    [dateFromMinuteOffset(-21), 'InProgress', true],
    [dateFromMinuteOffset(-21), 'NotStarted', false],
  ])
);
