import {UpdateNoteRequest, ValidationError, UpdatedNotesResponse} from 'miter-common/SharedTypes';
import {updateNote} from '../../data/notes-items/update-note';
import {Endpoint} from '../../server-core/socket-server';
import {validate as validateUuid} from 'uuid';
import {undefinedOrType, validateAndDeserializeDate} from 'miter-common/CommonUtil';
import {parseContentForDates, validateSocketRequestBody} from '../endpoint-utils';

const validateUpdateNoteRequest = (body: any): UpdateNoteRequest => {
  const validBody = validateSocketRequestBody(body);
  if (!(typeof validBody.id === 'string' && validateUuid(validBody.id))) {
    throw new ValidationError(`Edit-note request with invalid note ID: ${validBody.id}`);
  }
  if (!undefinedOrType(validBody, 'itemText', 'string')) {
    throw new ValidationError(`Received update-note request with invalid text: ${validBody.itemText}`);
  }
  if (body.targetDate) body.targetDate = validateAndDeserializeDate(body.targetDate);
  if (validBody.topicId && (typeof validBody.topicId !== 'string' || !validateUuid(validBody.topicId))) {
    throw new ValidationError(`Update-note request expected topic ID to be UUID, got ${validBody.text}`);
  }

  return validBody;
};

// Note: When setting topics, we don't have logic to ensure the meeting, calendar event, and topic
// are aligned. Doing this would require additional DB operations, and the need should go away,
// at least in part, when we re-associate notes with summaries.
export const updateNoteEndpoint: Endpoint = async (server, client, body) => {
  const updates = validateUpdateNoteRequest(body);

  if (updates.itemText) {
    const parsed = parseContentForDates(updates.itemText);
    updates.itemText = parsed.final;
    if (updates.targetDate === undefined && parsed.firstDate) {
      updates.targetDate = parsed.firstDate;
    }
  }

  const {note, summaryItem} = await updateNote(updates);

  const res: UpdatedNotesResponse = {changed: [note]};
  const channel = server.getExistingChannel(client);
  server.broadcast(channel, 'UpdatedNotes', res);
  if (summaryItem) server.broadcast(channel, 'UpdatedSummaryItems', {changed: [summaryItem]});
};
