/*
 * The tests here aren't comprehensive because we provide most of the coverage via the associated endpoint.
 */

import {MeetingPhase} from 'miter-common/SharedTypes';
import {fetchMeeting} from '../data/meetings-events/fetch-meeting';
import {insertTestMeeting, testName} from '../testing/generate-test-data';
import {changeMeetingPhase} from './change-meeting-phase';

const testFactory = (startPhase: MeetingPhase, expectPhase: MeetingPhase) => async () => {
  const {id} = await insertTestMeeting(testName(), {phase: startPhase});
  await changeMeetingPhase(id, expectPhase);
  const {phase} = await fetchMeeting(id);
  expect(phase).toBe(expectPhase);
};

test('changeMeetingPhase: Not Started -> In Progress', testFactory('NotStarted', 'InProgress'));
test('changeMeetingPhase: In Progress -> Ended', testFactory('InProgress', 'Ended'));
test('changeMeetingPhase: Ended -> In Progress', testFactory('Ended', 'InProgress'));
