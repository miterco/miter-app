import {Endpoint} from '../../server-core/socket-server';
import {
  PinNoteRequest,
  ItemTypeValues,
  UpdatedNotesResponse,
  UpdatedSummaryItemsResponse,
} from 'miter-common/SharedTypes';
import {ValidationError} from 'miter-common/SharedTypes';
import {validate as validateUuid} from 'uuid';
import {pinNote} from '../../data/notes-items/pin-note';
import {delayAutomatedSummaryEmailIfAppropriate} from '../endpoint-utils';

const validatePinNoteRequest = (body: any): PinNoteRequest => {
  if (!(typeof body.id === 'string' && validateUuid(body.id))) {
    throw new ValidationError(`Received pin-note request with invalid note ID of ${body.id}`);
  }
  if (!(typeof body.itemType === 'string' && ItemTypeValues.includes(body.itemType))) {
    throw new ValidationError(`Received a pin-note request with invalid item type of ${body.itemType}.`);
  }
  return body;
};

export const pinNoteEndpoint: Endpoint = async (server, client, body) => {
  const {note, summaryItem, summaryItemAlreadyExisted} = await pinNote(validatePinNoteRequest(body));
  const meetingId = server.getExistingChannel(client);

  const res: UpdatedNotesResponse = {changed: [note]};
  server.broadcast(meetingId, 'UpdatedNotes', res);

  const summItemRes: UpdatedSummaryItemsResponse = summaryItemAlreadyExisted
    ? {changed: [summaryItem]}
    : {created: [summaryItem]};
  server.broadcast(meetingId, 'UpdatedSummaryItems', summItemRes);

  await delayAutomatedSummaryEmailIfAppropriate(meetingId);
};
