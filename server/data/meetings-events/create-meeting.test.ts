import {createMeeting} from './create-meeting';
import {v4 as uuid} from 'uuid';
import {insertTestOrganizationAndDomain, testName} from '../../testing/generate-test-data';

const testFactory =
  (titlePrefix?: string, expectedGoalExempt: boolean = false) =>
  async () => {
    const phase = 'NotStarted';
    const title = `${titlePrefix || 'Test Title'} - ${testName()}`;
    const goal = 'Test goal';
    const zoomMeetingId = uuid().toString();

    const todayAtMidnight = new Date(new Date().setHours(0, 0, 0, 0));
    const startDatetime = new Date(todayAtMidnight);

    todayAtMidnight.setMinutes(todayAtMidnight.getMinutes() + 5);
    const endDatetime = new Date(todayAtMidnight);

    const organizationId = (await insertTestOrganizationAndDomain(testName())).organization.id;

    const newMeeting = await createMeeting({
      title,
      goal,
      startDatetime,
      endDatetime,
      allDay: false,
      phase,
      zoomMeetingId,
      zoomNumericMeetingId: null,
      organizationId,
    });

    expect(newMeeting?.title).toBe(title);
    expect(newMeeting?.goal).toBe(goal);
    expect(newMeeting?.startDatetime?.toString()).toBe(startDatetime.toString());
    expect(newMeeting?.endDatetime?.toString()).toBe(endDatetime.toString());
    expect(newMeeting?.phase).toBe(phase);
    expect(newMeeting?.zoomMeetingId).toBe(zoomMeetingId);
    expect(newMeeting?.isGoalExempt).toBe(expectedGoalExempt);
    expect(newMeeting.organizationId).toBe(organizationId);
  };

test('createMeeting - basic', testFactory());

test('createMeeting - exempt goal', testFactory('HOLD: Thing', true));
