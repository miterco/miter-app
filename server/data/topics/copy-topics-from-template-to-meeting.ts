import {Meeting, Note, Topic} from 'miter-common/SharedTypes';
import {fetchMeetingContent} from '../meetings-events/fetch-meeting';
import {fetchTemplate} from '../meetings-events/fetch-template';
import {fetchAllNotes} from '../notes-items/fetch-all-notes';
import {createBulkTopics} from './create-bulk-topics';
import {fetchAllTopicsForMeeting} from './fetch-all-topics';
import {createNote} from '../notes-items/create-note';
import {updateMeeting} from '../meetings-events/update-meeting';

const notesStartOffset = 1000 * 60 * 5; // 5m;
const oneSecond = 1000;

export const copyTopicsFromTemplateToMeeting = async (
  templateId: string,
  meetingId: string,
  copyNotes?: boolean
): Promise<{meeting: Meeting; topics: Topic[]; notes: Note[]}> => {
  // Mostly needed for Notes section but also checks there's a valid template with that ID
  const template = await fetchTemplate(templateId);
  const meetingWithContent = await fetchMeetingContent(meetingId);

  if (meetingWithContent.hasTopics || meetingWithContent.hasNotes || meetingWithContent.hasSummaryItems) {
    throw new Error(`Meeting ${meetingId} already has content`);
  }

  const updatedMeeting = await updateMeeting({id: meetingId, goal: template.goal});

  const templateTopics = await fetchAllTopicsForMeeting(template.id);
  if (templateTopics) await createBulkTopics(meetingId, templateTopics);
  const meetingTopics = await fetchAllTopicsForMeeting(meetingId);

  if (!copyNotes) return {meeting: updatedMeeting, topics: meetingTopics, notes: []};

  const templateNotes = await fetchAllNotes(templateId);
  const noteStartTime = meetingWithContent.meeting.startDatetime
    ? new Date(meetingWithContent.meeting.startDatetime.getDate() - notesStartOffset)
    : new Date();

  for (let i = 0; i < templateNotes.length; i++) {
    const {
      id: _templateIdStrippedOut,
      ownerId: _ownerIdStrippedOut,
      topicId: templateTopicId,
      timestamp: templateTimeStamp,
      ...templateNote
    } = templateNotes[i];
    const topicId = meetingTopics[templateTopics.findIndex(row => row.id === templateTopicId)].id;
    const timestamp = new Date(noteStartTime.getDate() + i * oneSecond);
    await createNote({...templateNote, meetingId, topicId}, timestamp);
  }

  const meetingNotes = await fetchAllNotes(meetingId);

  return {meeting: updatedMeeting, topics: meetingTopics, notes: meetingNotes};
};
