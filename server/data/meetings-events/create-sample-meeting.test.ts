import {getEndOfDay, getStartOfDay} from 'miter-common/CommonUtil';
import {getDateDaysAfterToday} from '../../google-apis/google-calendar';
import {insertTestDataForLocking, insertTestUser, testName} from '../../testing/generate-test-data';
import {fetchAllNotes} from '../notes-items/fetch-all-notes';
import {fetchAllSummaryItems} from '../notes-items/fetch-all-summary-items';
import {fetchPersonByUserId} from '../people/fetch-person';
import {fetchAllTopicsForMeeting} from '../topics/fetch-all-topics';
import {createSampleMeeting, OnboardingTemplateId} from './create-sample-meeting';
import {fetchMeetingsInWindow} from './fetch-meetings-in-window';
import {fetchTemplate} from './fetch-template';

describe('createSampleMeeting', () => {
  it('should create a new meeting with the template information, set isSampleMeeting=true, and create an additional Action Item', async () => {
    const user = await insertTestUser(testName());
    const person = await fetchPersonByUserId(user.id);
    if (!person) throw new Error('User not properly created');

    const meeting = await createSampleMeeting(user, person);

    const template = await fetchTemplate(OnboardingTemplateId);
    expect(meeting.goal).toBe(template.goal);
    expect(meeting.isTemplate).toBeFalsy();
    expect(meeting.isSampleMeeting).toBeTruthy();
    expect(meeting.title).toBe(template.title);
    expect(meeting.startDatetime).toBeTruthy();
    expect(meeting.endDatetime).toBeTruthy();
    expect(meeting.organizationId).toBeFalsy();

    const topics = await fetchAllTopicsForMeeting(meeting.id);
    const templateTopics = await fetchAllTopicsForMeeting(template.id);
    expect(topics).toHaveLength(templateTopics.length);

    const notes = await fetchAllNotes(meeting.id);
    const templateNotes = await fetchAllNotes(template.id);
    expect(notes).toHaveLength(templateNotes.length);

    const summaryItems = await fetchAllSummaryItems(meeting.id);
    const templateSummaryItems = await fetchAllSummaryItems(template.id);
    expect(summaryItems).toHaveLength(templateSummaryItems.length + 1);
    const task = summaryItems[summaryItems.length - 1];
    expect(task.itemType).toBe('Task');
    expect(task.itemOwnerId).toBe(user.personId);
    expect(task.itemText?.indexOf(user.loginEmail)).toBe(0);

    const meetingList = await fetchMeetingsInWindow(
      person.id,
      getStartOfDay(getDateDaysAfterToday(-1), 0), // Start of time window.
      getEndOfDay(getDateDaysAfterToday(1), 0) // End of time window.
    );

    expect(meetingList).toHaveLength(1);
    expect(meetingList[0].meeting.id).toBe(meeting.id);
    expect(meetingList[0].meeting.organizationId).toBeFalsy();
  });

  it('should lock a meeting if the user is in a locked organization', async () => {
    const {lockedUser, lockedOrganization} = await insertTestDataForLocking();

    const person = await fetchPersonByUserId(lockedUser.id);
    if (!person) throw new Error('User not properly created');

    const meeting = await createSampleMeeting(lockedUser, person);
    expect(meeting.organizationId).toBe(lockedOrganization.id);
  });
});
