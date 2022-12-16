import {delay, insertTestMeeting, insertTestMeetingAndCalendarEvent, testName} from '../../testing/generate-test-data';
import {
  cancelChangeMeetingPhaseEndpoint,
  changeMeetingPhaseEndpoint,
  executePhaseChange,
} from './change-meeting-phase-endpoint';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {fetchEmailJobsForMeeting} from '../../data/jobs/fetch-email-job';
import {createSummaryItemEndpoint} from '../notes-items/create-summary-item-endpoint';
import {CreateSummaryItemRequest, DeleteSummaryItemRequest, UpdateSummaryItemRequest} from 'miter-common/SharedTypes';
import {fetchAllSummaryItems} from '../../data/notes-items/fetch-all-summary-items';
import {updateSummaryItemEndpoint} from '../notes-items/update-summary-item-endpoint';
import {deleteSummaryItemEndpoint} from '../notes-items/delete-summary-item-endpoint';
import {mockSocketServer, mockWebSocket} from '../../data/test-util';

// TODO: Mostly we're now testing executePhaseChange() and the direct endpoint test is perfunctory. That's because I
// can't get jest.useFakeTimers() and jest.runAllTimers() to play nice with our codebase. It might have something to do
// with async stuff running after runAllTimers() finishes:
// https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function
// But my attempts to take the recommendations in that thread have not helped. It might also have something to do with
// Other packages relying on timers in ways that Jest doesn't expect. Regardless, I'm not comfortable investing more
// time in it right now.
//
// Further, Jest seems to be moving away from the "legacy" fake timers we use, and their modern implementation just hangs
// our tests. So all in all, something to look at fixing here.

// -------------------------------------------------------------------------------------------------
//                                         CHANGE ENDPOINT
// -------------------------------------------------------------------------------------------------

test('Change Meeting Phase Endpoint - Endpoint Itself', async () => {
  jest.useFakeTimers('legacy');
  const server = mockSocketServer();
  const client = mockWebSocket();
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getInfoForChannel as jest.Mock).mockReturnValueOnce(null);
  (server.getInfoForChannel as jest.Mock).mockReturnValueOnce({});
  (setTimeout as any).mockClear();

  await changeMeetingPhaseEndpoint(server, client, {phase: 'InProgress'});
  expect(setTimeout).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'MeetingPhaseChangePending', {
    phase: 'InProgress',
    changeTime: expect.any(Number),
  });
  (setTimeout as any).mockClear();
  (server.broadcast as any).mockClear();

  await changeMeetingPhaseEndpoint(server, client, {phase: 'Ended'});
  expect(clearTimeout).toHaveBeenCalledTimes(1);
  expect(setTimeout).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledWith(meeting.id, 'MeetingPhaseChangePending', {
    phase: 'Ended',
    changeTime: expect.any(Number),
  });

  jest.useRealTimers();
});

// -------------------------------------------------------------------------------------------------
//                                         CANCEL ENDPOINT
// -------------------------------------------------------------------------------------------------

test('Cancel Change Meeting Phase - Nothing Preexisting', async () => {
  jest.useFakeTimers('legacy');
  const {id: meetingId} = await insertTestMeeting(testName());
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getExistingChannel as jest.Mock).mockReturnValue(meetingId);

  await cancelChangeMeetingPhaseEndpoint(server, client, {});
  expect(clearTimeout).toHaveBeenCalledTimes(0);
  expect(server.broadcast).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledWith(meetingId, 'MeetingPhaseChangeCanceled', null);

  jest.useRealTimers();
});

test('Cancel Change Meeting Phase - Pending Change', async () => {
  jest.useFakeTimers('legacy');
  const {id: meetingId} = await insertTestMeeting(testName());
  const server = mockSocketServer();
  const client = mockWebSocket();

  (server.getExistingChannel as jest.Mock).mockReturnValue(meetingId);
  (server.getInfoForChannel as jest.Mock).mockReturnValueOnce(null); // for the change-phase call
  (server.getInfoForChannel as jest.Mock).mockReturnValueOnce({}); // for the cancel call

  await changeMeetingPhaseEndpoint(server, client, {phase: 'InProgress'});
  (server.broadcast as any).mockClear();

  await cancelChangeMeetingPhaseEndpoint(server, client, {});
  expect(clearTimeout).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledTimes(1);
  expect(server.broadcast).toHaveBeenCalledWith(meetingId, 'MeetingPhaseChangeCanceled', null);

  jest.useRealTimers();
});

// -------------------------------------------------------------------------------------------------
//                                          CHANGE LOGIC
// -------------------------------------------------------------------------------------------------

test('Exec Change Meeting Phase - Just the Phase Logic', async () => {
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  const server = mockSocketServer();
  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);

  expect(meeting.phase).toBe('NotStarted');

  await executePhaseChange(server, meeting.id, 'InProgress');

  const fetchInProgress = await fetchMeeting(meeting.id);
  expect(fetchInProgress.phase).toBe('InProgress');

  await executePhaseChange(server, meeting.id, 'Ended');

  const fetchEnded = await fetchMeeting(meeting.id);
  expect(fetchEnded.phase).toBe('Ended');
});

test('Exec Change Meeting Phase - Email Job Logic', async () => {
  const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';

  const client = mockWebSocket();
  const server = mockSocketServer();
  const {meeting} = await insertTestMeetingAndCalendarEvent(testName());
  (server.getExistingChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getClientChannel as jest.Mock).mockReturnValue(meeting.id);
  (server.getUserForClient as jest.Mock).mockReturnValue({userId});

  expect(meeting.phase).toBe('NotStarted');

  // NotStarted -> InProgress: No change
  await executePhaseChange(server, meeting.id, 'InProgress');
  await delay(300); // A little hacky and maybe now that there's a timer in the FE we can just await email insert?
  const jobsForInProgress = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsForInProgress).toHaveLength(0);

  // InProgress -> Ended: Create Job
  await executePhaseChange(server, meeting.id, 'Ended');
  await delay(300);
  const jobsForEnded = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsForEnded).toHaveLength(1);
  expect(jobsForEnded[0].jobStatus).toBe('NotStarted');

  // Ended -> In Progress Cancel Job
  await executePhaseChange(server, meeting.id, 'InProgress');
  await delay(300);
  const jobsForRestarted = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsForRestarted).toHaveLength(1);
  expect(jobsForRestarted[0].jobStatus).toBe('Canceled');

  // InProgess -> Ended (again): Create a 2nd Job
  await executePhaseChange(server, meeting.id, 'Ended');
  await delay(300);
  const jobsForReEnded = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsForReEnded).toHaveLength(2);
  expect(jobsForReEnded[0].jobStatus).toBe('Canceled');
  expect(jobsForReEnded[1].jobStatus).toBe('NotStarted');

  // Ended & createSummaryItem: Delay Job
  const createSummaryItemBody: CreateSummaryItemRequest = {
    summaryItem: {noteId: null, itemType: 'Decision', itemText: 'Test Item', targetDate: null},
  };
  await createSummaryItemEndpoint(server, client, createSummaryItemBody);
  const jobsAfterSummaryItemCreation = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsAfterSummaryItemCreation).toHaveLength(2);
  expect(jobsAfterSummaryItemCreation[1].jobStatus).toBe('NotStarted');
  if (!jobsAfterSummaryItemCreation[1].sendAfter || !jobsForReEnded[1].sendAfter) throw 'Here for TS reasons';
  expect(jobsAfterSummaryItemCreation[1].sendAfter?.getTime()).toBeGreaterThan(jobsForReEnded[1].sendAfter?.getTime());

  const summaryItems = await fetchAllSummaryItems(meeting.id);
  const summaryItemId = summaryItems[0].id;

  // Ended & editSummaryItem: Delay Job
  const updatedSummaryItemBody: UpdateSummaryItemRequest = {id: summaryItemId, itemText: 'Test Item 2'};
  await updateSummaryItemEndpoint(server, client, updatedSummaryItemBody);
  const jobsAfterSummaryItemUpdate = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsAfterSummaryItemUpdate).toHaveLength(2);
  expect(jobsAfterSummaryItemUpdate[1].jobStatus).toBe('NotStarted');
  if (!jobsAfterSummaryItemUpdate[1].sendAfter || !jobsAfterSummaryItemCreation[1].sendAfter) {
    throw 'Here for TS reasons';
  }
  expect(jobsAfterSummaryItemUpdate[1].sendAfter?.getTime()).toBeGreaterThan(
    jobsAfterSummaryItemCreation[1].sendAfter?.getTime()
  );

  // Ended & deleteSummaryItem: Delay Job
  const deleteSummaryItemBody: DeleteSummaryItemRequest = {id: summaryItemId};
  await deleteSummaryItemEndpoint(server, client, deleteSummaryItemBody);
  const jobsAfterSummaryItemDelete = await fetchEmailJobsForMeeting(meeting.id);
  expect(jobsAfterSummaryItemDelete).toHaveLength(2);
  expect(jobsAfterSummaryItemDelete[1].jobStatus).toBe('NotStarted');
  if (!jobsAfterSummaryItemDelete[1].sendAfter || !jobsAfterSummaryItemUpdate[1].sendAfter) throw 'Here for TS reasons';
  expect(jobsAfterSummaryItemDelete[1].sendAfter?.getTime()).toBeGreaterThan(
    jobsAfterSummaryItemUpdate[1].sendAfter?.getTime()
  );
});
