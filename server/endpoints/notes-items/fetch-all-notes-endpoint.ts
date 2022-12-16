import { AllNotesResponse } from 'miter-common/SharedTypes';
import { fetchMeeting, fetchMeetingByCalendarEvent } from '../../data/meetings-events/fetch-meeting';
import { fetchAllNotes } from '../../data/notes-items/fetch-all-notes';
import { Endpoint } from '../../server-core/socket-server';

export const fetchAllNotesEndpoint: Endpoint = async (server, client) => {
  // TODO possible race condition here
  const meetingId = server.getExistingChannel(client);
  const meeting = await fetchMeeting(meetingId);

  const notes = await fetchAllNotes(meeting.id);
  if (!notes) throw new Error(`Unable to retrieve notes for meeting ${meeting.id}`);
  const res: AllNotesResponse = { notes };
  server.send(client, 'AllNotes', res);
};