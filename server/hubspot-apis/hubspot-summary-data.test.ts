import {ProductSurface, SignUpService} from '@prisma/client';
import {uuid} from 'miter-common/CommonUtil';
import {addMeetingAttendee} from '../data/people/add-meeting-attendee';
import {createUser} from '../data/people/create-user';
import {
  insertTestMeeting,
  insertTestNote,
  insertTestNoteAndSummaryItem,
  insertTestTopic,
  testName,
} from '../testing/generate-test-data';
import {populateHubspotSummaryData} from './hubspot-summary-data';

test('summaryDataTest', async () => {
  // insertTestUser bypasses HS Creation so we need to create explicitly
  const user = await createUser(
    {
      firstName: testName(),
      lastName: testName(),
      displayName: testName(),
      loginEmail: `${uuid()}@example.com`,
      signUpService: SignUpService.Google,
      signUpProductSurface: ProductSurface.WebApp,
      serviceId: uuid(),
      zoomUserId: null,
    },
    {},
    {},
    true,
    true
  );
  const meeting = await insertTestMeeting(testName(), {phase: 'InProgress'});
  await addMeetingAttendee(meeting.id, user.id);
  await insertTestTopic(meeting.id, 'Test Topic 1', {createdBy: user.id});
  await insertTestTopic(meeting.id, 'Test Topic 2', {createdBy: user.id});
  await insertTestNote(meeting.id, 'Test Item 1', {createdBy: user.id});
  await insertTestNote(meeting.id, 'Test Item 2', {createdBy: user.id});
  await insertTestNoteAndSummaryItem(meeting.id, 'Test Item 3', {createdBy: user.id});
  await insertTestNoteAndSummaryItem(meeting.id, 'Test Item 4', {createdBy: user.id, itemType: 'Task'});
  const summaryData = await populateHubspotSummaryData();

  const newUserSummary = summaryData.find(data => data.properties.miter_user_id === user.id);
  if (!newUserSummary) throw `User ID ${user.id} not found in Summary Data`;
  expect(newUserSummary.id).toBeTruthy();
  expect(newUserSummary.properties.number_of_notes_authored).toBe('4');
  expect(newUserSummary.properties.number_of_summary_items_pinned).toBe('2');
  expect(newUserSummary.properties.number_of_tasks_owned).toBe('1'); // Does not task created by createSampleMeeting
  expect(newUserSummary.properties.number_of_topics_authored).toBe('2');
  expect(newUserSummary.properties.number_of_meetings_attended).toBe('1');
});
