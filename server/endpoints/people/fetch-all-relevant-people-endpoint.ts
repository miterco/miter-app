import {Person, RelevantPeopleResponse, EmailRecipientWithId} from 'miter-common/SharedTypes';
import {UserRecord} from '../../server-core/server-types';
import {fetchAttendees} from '../../data/people/fetch-attendees';
import {Endpoint} from '../../server-core/socket-server';
import {
  convertFullPersonRecordToRecipientWithId,
  convertUserRecordToRecipientWithId,
} from '../../server-core/server-util';
import {fetchCalendarEventPeople} from '../../data/people/fetch-calendar-event-people';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {fetchCalendarEventByMeetingId} from '../../data/meetings-events/fetch-calendar-event';

// Note: I'd love to give this a less awkward / more generalized name but can't think of  a good one.
// It's all the people associated with the calendar event / meeting in any way for whom we have an email address.
// Can't say meetingPeopleWithEmails because "meeting people" has a separate meaning.

export const fetchAllRelevantPeopleEndpoint: Endpoint = async (server, client, _body, requestId) => {
  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);
  const calendarEvent = await fetchCalendarEventByMeetingId(meetingId);
  const calEventPeople = calendarEvent?.id ? await fetchCalendarEventPeople(calendarEvent.id) : [];
  const attendees: UserRecord[] = meeting ? await fetchAttendees(meeting.id) : [];

  // Union meeting-people (folks on the invite) and attendees (folks who joined at some point).
  // Note different source array types. Not using a Set here because these are references
  // so we have to do a comparison for each element in the second array anyway.
  const resultMap: Record<string, EmailRecipientWithId> = {};

  // Add all authenticated users who belong to the meeting org to the list of relevant people.
  attendees.forEach(attendee => {
    if (attendee.loginEmail in resultMap) return; // Avoid processing the same user twice.
    if (meeting.organizationId && meeting.organizationId !== attendee.organizationId) return;
    resultMap[attendee.loginEmail] = convertUserRecordToRecipientWithId(attendee);
  });

  // Add all the people who are associated with the calendar event to the list of relevant people, as long as they are
  // part of the same organization.
  calEventPeople.forEach(person => {
    if (person.email in resultMap) return; // Avoid processing the same user twice.
    if (meeting.organizationId && meeting.organizationId !== person.organizationId) return;
    resultMap[person.email] = convertFullPersonRecordToRecipientWithId(person);
  });

  // Sorting is mostly to ease testing
  const people = Object.values(resultMap).sort((a, b) => (a.email < b.email ? -1 : 1));
  const responseBody: RelevantPeopleResponse = {people};
  server.send(client, 'AllRelevantPeople', responseBody);
};
