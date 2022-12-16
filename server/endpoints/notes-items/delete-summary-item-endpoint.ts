import {DeleteSummaryItemRequest, UpdatedSummaryItemsResponse, ValidationError} from 'miter-common/SharedTypes';
import {Endpoint} from '../../server-core/socket-server';
import {validate as validateUuid} from 'uuid';
import {deleteSummaryItem} from '../../data/notes-items/delete-summary-item';
import {delayAutomatedSummaryEmailIfAppropriate} from '../endpoint-utils';

const validateRequest = (body: any): DeleteSummaryItemRequest => {
  if (!body) throw new ValidationError('Unpin-item request is missing a body.');
  if (typeof body.id !== 'string' || !validateUuid(body.id)) {
    throw new ValidationError('Unpin-item request received an invalid item ID.');
  }

  return body;
};

export const deleteSummaryItemEndpoint: Endpoint = async (server, client, body) => {
  const validBody = validateRequest(body);
  const {note} = await deleteSummaryItem(validBody.id);

  const payload: UpdatedSummaryItemsResponse = {deleted: [validBody]};
  const meetingId = server.getClientChannel(client);
  if (meetingId) {
    // User is in a meeting
    server.broadcast(meetingId, 'UpdatedSummaryItems', payload);
    if (note) server.broadcast(meetingId, 'UpdatedNotes', {changed: [note]});
    await delayAutomatedSummaryEmailIfAppropriate(meetingId);
  } else {
    server.send(client, 'UpdatedSummaryItems', payload);
  }
};
