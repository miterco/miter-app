import * as gCal from './google-calendar';
import {v4 as uuid} from 'uuid';
import * as gAuth from './google-auth';
import {google} from 'googleapis';
import {editGoogleIdentifiers} from '../data/edit-google-identifiers';
import {fetchGoogleIdentifiers} from '../data/fetch-google-identifiers';
import {createBulkCalendarEvents} from '../data/meetings-events/create-bulk-calendar-events';
import {fetchCalendarEventByGoogleId} from '../data/meetings-events/fetch-calendar-event';
import {fetchCalendarEventPeople} from '../data/people/fetch-calendar-event-people';
import {getGCalEventPermutations, getSampleGCalEvents, RawGCalEvent, testName} from '../testing/generate-test-data';
import {fetchMeeting, fetchMeetingByCalendarEvent} from '../data/meetings-events/fetch-meeting';
import {updateMeeting} from '../data/meetings-events/update-meeting';
import {UnsavedCalendarEventWithAttendees, UserRecord} from '../server-core/server-types';
import {MeetingPhase} from 'miter-common/SharedTypes';
import {fetchUserByGoogleId} from '../data/people/fetch-user';

const macMeetingGoogleId = '2rq3l9vr1k7rcb8afcmkg4c3fk';
const macMeetingSubsequentGoogleId = '2rq3l9vr1k7rcb8afcmkg4c3fk_20210527T180000Z';
const testUserId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';
const organizerOnlyServiceId = '46crro2haeoj19v2lh00pu5j5d';
const nonCancelledNumber = 77;

let rawGCalEvents: RawGCalEvent[];
let transformedGCalEvents: UnsavedCalendarEventWithAttendees[];
let serviceIdUniquePrefix: string;
let user: UserRecord | null = null;

// Mocks & shared test data
jest.mock('./google-auth');
jest.mock('googleapis');
jest.mock('../data/fetch-google-identifiers');
jest.mock('../data/edit-google-identifiers');

beforeAll(async () => {
  (gAuth.getAuthClient as jest.Mock).mockResolvedValue({});
  const {rawEvents, transformedEvents, idPrefix} = await getSampleGCalEvents();
  rawGCalEvents = rawEvents;
  transformedGCalEvents = transformedEvents;
  serviceIdUniquePrefix = idPrefix;
  user = await fetchUserByGoogleId('104169948880648460000');
});

test('Convert and Store Google Events', async () => {
  expect(transformedGCalEvents).toHaveLength(rawGCalEvents.length);

  const updatedEvents = await createBulkCalendarEvents(transformedGCalEvents, user);

  expect(updatedEvents).toHaveLength(nonCancelledNumber);
  if (updatedEvents) expect(updatedEvents[0]).toHaveProperty('id');

  const macFirstMeeting = await fetchCalendarEventByGoogleId(serviceIdUniquePrefix + macMeetingGoogleId);
  const macMeetingTitle = 'Miter <> MaC Bi-Weekly';
  expect(macFirstMeeting?.startTime).toEqual(new Date('2021-05-13T11:00:00-07:00'));
  expect(macFirstMeeting?.title).toBe(macMeetingTitle);
  expect((macFirstMeeting as any)?.meeting.isFirstMeetingInSeries).toBe(true);

  const macSecondMeeting = await fetchCalendarEventByGoogleId(serviceIdUniquePrefix + macMeetingSubsequentGoogleId);
  expect(macSecondMeeting?.startTime).toEqual(new Date('2021-05-27T11:00:00-07:00'));
  expect(macSecondMeeting?.title).toBe(macMeetingTitle);
  expect((macSecondMeeting as any)?.meeting.isFirstMeetingInSeries).toBe(false);
});

test('Retrieve calendar events from Google', async () => {
  const eventListMock = jest
    .fn()
    .mockResolvedValueOnce({data: {items: rawGCalEvents, nextSyncToken: 'fake sync token'}})
    .mockRejectedValueOnce({response: {data: {error: 'invalid_grant'}}})
    .mockRejectedValueOnce(new Error('Vanilla Error'));
  (google.calendar as jest.Mock).mockImplementation(() => ({events: {list: eventListMock}}));

  const eventsResult = await gCal.getAllEventsInWindow(testUserId);
  expect(eventsResult?.events).toHaveLength(rawGCalEvents.length);
  expect(eventsResult).toHaveProperty('syncToken');

  await expect(gCal.getAllEventsInWindow(testUserId)).rejects.toThrow();
  await expect(gCal.getAllEventsInWindow(testUserId)).rejects.toThrow();
});

test('Create Push Channel', async () => {
  const watchMock = jest
    .fn()
    .mockResolvedValueOnce({data: {resourceId: '12345'}})
    .mockResolvedValueOnce({data: {}})
    .mockRejectedValueOnce(new Error('Vanilla Error'));
  (google.calendar as jest.Mock).mockImplementation(() => ({events: {watch: watchMock}}));

  const successResult = await gCal.createPushChannel(uuid());
  expect(successResult).toHaveProperty('channelId');
  expect(successResult).toHaveProperty('resourceId');

  expect(await gCal.createPushChannel(uuid())).toBeNull(); // No resource ID

  const failResult = await gCal.createPushChannel(uuid()); // Other error
  expect(failResult).toBeNull();
});

// Possible TODO: I split establishCalendarConnectionIfNeeded into three functions so we can
// send a response midway through it for performance reasons. I'm creating this convenience
// function to keep the tests consistent but we probably want to refactor the tests.
const combinedCalendarConnectionFunctions = async (userId: string) => {
  if (!user) throw new Error('user not found');
  const {connected, needInitialPull} = await gCal.establishCalendarConnectionIfNeeded(userId);
  if (needInitialPull) await gCal.getInitialNearTermSingleEventInstances(user, null);
  if (needInitialPull) await gCal.getInitialGoogleCalendarDataAndStartSync(user);

  return connected;
};

test('establishCalendarConnectionIfNeeded -- composite function', async () => {
  // Mock our function to get a Google auth client--the empty value won't be used.
  (gAuth.getAuthClient as jest.Mock).mockResolvedValue({});

  // Mock fetchGoogleIdentifiers() since we've tested it elsewhere
  (fetchGoogleIdentifiers as jest.Mock)
    .mockResolvedValueOnce({id: uuid(), serviceId: uuid(), tokens: {scope: 'blah blah calendar blah'}})
    .mockResolvedValueOnce({id: uuid(), serviceId: uuid(), tokens: {scope: 'blah blah blah blah'}})
    .mockResolvedValueOnce(null);

  // Mock Google APIs for events.list and events.watch
  const eventListMock = jest
    .fn()
    .mockResolvedValueOnce({data: {items: rawGCalEvents, nextSyncToken: 'fake sync token'}});
  const watchMock = jest.fn().mockResolvedValue({data: {resourceId: '12345'}});

  (google.calendar as jest.Mock).mockImplementation(() => ({
    events: {
      list: eventListMock,
      watch: watchMock,
    },
  }));

  // Mock editGoogleIdentifiers
  (editGoogleIdentifiers as jest.Mock).mockResolvedValue({});

  await expect(combinedCalendarConnectionFunctions(testUserId)).resolves.toBe(true);
  await expect(combinedCalendarConnectionFunctions(testUserId)).resolves.toBe(false);
  await expect(combinedCalendarConnectionFunctions(testUserId)).rejects.toThrow();

  // TODO now that we've refactorsed establishCalendarConnectionIfNeeded, I'm only testing
});

test('Single Person Meeting', async () => {
  const result = await fetchCalendarEventByGoogleId(serviceIdUniquePrefix + organizerOnlyServiceId);

  expect(result?.serviceId).toBe(serviceIdUniquePrefix + organizerOnlyServiceId);

  if (result?.id) {
    const calendarEventPeople = await fetchCalendarEventPeople(result.id);
    expect(calendarEventPeople?.length).toBe(1);
  }
});

// -------------------------------------------------------------------------------------------------
//                                  Meeting-Phase Ingestion Lock
// These test our logic that prevents calendar-event changes from overwriting meetings once they've
// started.
// -------------------------------------------------------------------------------------------------

describe('Calendar-ingestion freeze based on meeting phase', () => {
  let calendarEvents: UnsavedCalendarEventWithAttendees[];
  let serviceIdUniquePrefix: string;

  beforeAll(async () => {
    const testGCalData = await getGCalEventPermutations();
    calendarEvents = testGCalData.transformedEvents;
    serviceIdUniquePrefix = testGCalData.idPrefix;

    user = await fetchUserByGoogleId('104169948880648460000');

    await createBulkCalendarEvents(calendarEvents, user); // Initial load
  });

  const factory =
    (serviceId: string, changePhaseTo: MeetingPhase | undefined, expectGCalTitle: boolean) => async () => {
      const calEvent = await fetchCalendarEventByGoogleId(serviceIdUniquePrefix + serviceId);
      if (!calEvent) throw 'Expected a calendar event and got null.';
      const meeting = await fetchMeetingByCalendarEvent(calEvent.id);
      const oldTitle = meeting.title;
      const newTitle = `${testName()} ${uuid()}`;

      await updateMeeting({id: meeting.id, phase: changePhaseTo || undefined, title: newTitle});

      await createBulkCalendarEvents(calendarEvents, user); // Load as if from Google so we have changes

      const fetched = await fetchMeeting(meeting.id);
      expect(fetched.phase).toBe(changePhaseTo || 'NotStarted');
      expect(fetched.title).toBe(expectGCalTitle ? oldTitle : newTitle);

      await updateMeeting({id: meeting.id, phase: 'NotStarted', title: oldTitle}); // Restore to unfrozen state
    };

  it(
    'should overwrite the title of NotStarted single-instance meeting',
    factory('singleInstanceYesMiterId', undefined, true)
  );

  it(
    'should overwrite title of NotStarted first-instance meeting',
    factory('firstInstanceOfRecurringNoMiterId', undefined, true)
  );

  it(
    'should overwrite title of NotStarted nth-instance meeting',
    factory('firstInstanceOfRecurringYesMiterIdYesAdditional_20210625T180000Z', undefined, true)
  );

  it(
    'should overwrite title of in-progress single-instance meeting',
    factory('singleInstanceYesMiterId', 'InProgress', true)
  );

  it(
    'should overwrite title of in-progress first-instance meeting',
    factory('firstInstanceOfRecurringNoMiterId', 'InProgress', true)
  );

  it(
    'should overwrite title of in-progress nth-instance meeting',
    factory('firstInstanceOfRecurringYesMiterIdYesAdditional_20210625T180000Z', 'InProgress', true)
  );

  it(
    'should not overwrite title of Ended single-instance meeting',
    factory('singleInstanceYesMiterId', 'Ended', false)
  );

  it(
    'should not overwrite title of Ended first-instance meeting',
    factory('firstInstanceOfRecurringNoMiterId', 'Ended', false)
  );

  it(
    'should not overwrite title of Ended nth-instance meeting',
    factory('firstInstanceOfRecurringYesMiterIdYesAdditional_20210625T180000Z', 'Ended', false)
  );
});
