import {undefinedOrType, validateAndDeserializeDate} from 'miter-common/CommonUtil';
import {
  UnsavedNote,
  ValidationError,
  ItemTypeValues,
  CreateNoteRequest,
  UpdatedNotesResponse,
} from 'miter-common/SharedTypes';
import {createNote} from '../../data/notes-items/create-note';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {Endpoint} from '../../server-core/socket-server';
import {validateSocketRequestBody, parseContentForDates} from '../endpoint-utils';
import {logPerf} from '../../server-core/server-util';
import {saveAssociatedPeopleForNote} from '../../data/notes-items/update-associated-people';

const validateUnsavedNote = (json: NonNullable<any>): UnsavedNote => {
  if (typeof json.itemText !== 'string') {
    throw new ValidationError(`All note types have string text; got ${typeof json.itemText}`);
  }
  if (!undefinedOrType(json, 'itemType', 'string')) {
    throw new ValidationError(`A note's item type should be undefined or a string; got ${typeof json.itemType}`);
  }
  if (json.itemType && !ItemTypeValues.includes(json.itemType)) {
    throw new ValidationError(`A note's item type should be a PinType but got ${json.itemType} instead.`);
  }
  if (json.targetDate) json.targetDate = validateAndDeserializeDate(json.targetDate);

  if (json.id) throw new ValidationError(`Unsaved notes should not have an ID.`);
  if (json.calendarEvent) throw new ValidationError(`Unsaved notes should not have a calendar event ID.`);
  if (json.timestamp) throw new ValidationError(`Unsaved notes should not have a timestamp.`);
  if (json.createdBy) throw new ValidationError('Unsaved notes should not specify an author.');

  return json;
};

const validateCreateNoteRequest = (body: any): CreateNoteRequest => {
  const validBody = validateSocketRequestBody(body);
  if (!validBody.note) throw new ValidationError(`Got a create-note request without a note to create.`);
  return {note: validateUnsavedNote(validBody.note)};
};

export const createNoteEndpoint: Endpoint = async (server, client, body) => {
  const startTimestamp = Date.now();
  const unsavedNote = validateCreateNoteRequest(body).note;

  const parsed = parseContentForDates(unsavedNote.itemText);
  unsavedNote.itemText = parsed.final;
  if (!unsavedNote.targetDate) unsavedNote.targetDate = parsed.firstDate;

  const meetingId = server.getExistingChannel(client);

  logPerf(startTimestamp, 'createNoteEndpoint before DB ops');

  const meeting = await fetchMeeting(meetingId);

  logPerf(startTimestamp, 'createNoteEndpoint after fetch');

  const {note, summaryItem} = await createNote({
    ...unsavedNote,
    createdBy: server.getUserForClient(client).userId,
    meetingId: meeting.id,
    topicId: meeting?.currentTopicId,
    itemType: unsavedNote.itemType || 'None',
  });

  logPerf(startTimestamp, 'createNoteEndpoint after create');

  const res: UpdatedNotesResponse = {created: [note]};
  server.broadcast(meetingId, 'UpdatedNotes', res);

  if (summaryItem) server.broadcast(meetingId, 'UpdatedSummaryItems', {created: [summaryItem]});

  // Moving after broadcast for performance reasons. Awaiting just in case.
  await saveAssociatedPeopleForNote(note);

  logPerf(startTimestamp, 'createNoteEndpoint completed');
};
