import {
  UpdateSummaryItemRequest,
  ItemTypeValues,
  UpdatedSummaryItemsResponse,
  ValidationError,
} from 'miter-common/SharedTypes';
import {updateSummaryItem} from '../../data/notes-items/update-summary-item';
import {Endpoint} from '../../server-core/socket-server';
import {validate as validateUuid} from 'uuid';
import {undefinedOrString, validateAndDeserializeDate} from 'miter-common/CommonUtil';
import {delayAutomatedSummaryEmailIfAppropriate} from '../endpoint-utils';

const validateUpdateSummaryItemRequest = (body: any): UpdateSummaryItemRequest => {
  if (!body) throw new ValidationError('Edit-item request is missing a body.');
  if (typeof body.id !== 'string' || !validateUuid(body.id)) {
    throw new ValidationError('Edit-item request has an invalid ID.');
  }
  if (body.itemType && (typeof body.itemType !== 'string' || ItemTypeValues.indexOf(body.itemType) === -1)) {
    throw new ValidationError(`Edit-item request got an invalid item type: ${body.itemType}`);
  }
  if (!undefinedOrString(body, 'itemText')) {
    throw new ValidationError(`Edit-item request got an invalid item text: ${body.itemText}`);
  }
  if (!undefinedOrString(body, 'itemText2')) {
    throw new ValidationError(`Edit-item request got an invalid secondary item text: ${body.itemText2}`);
  }
  if (body.targetDate) body.targetDate = validateAndDeserializeDate(body.targetDate);
  if (body.topicId && !validateUuid(body.topicId)) {
    throw new ValidationError(`Edit-item request got an invalid topic ID: ${body.topicId}`);
  }

  if (Object.keys(body).length < 2) throw new ValidationError('Edit-item request lacks any new valid data.');

  return body;
};

// Note: When setting topics, we don't have logic to ensure the summary, calendar event, and topic
// are aligned. Doing this would require additional DB operations, and the need should go away,
// at least in part, when we re-associate notes with summaries.
export const updateSummaryItemEndpoint: Endpoint = async (server, client, body) => {
  const validBody = validateUpdateSummaryItemRequest(body);
  const {summaryItem, note} = await updateSummaryItem(validBody);
  const responseBody: UpdatedSummaryItemsResponse = {changed: [summaryItem]};
  const meetingId = server.getClientChannel(client);
  if (meetingId) {
    server.broadcast(meetingId, 'UpdatedSummaryItems', responseBody);
    if (note) server.broadcast(meetingId, 'UpdatedNotes', {changed: [note]});
    await delayAutomatedSummaryEmailIfAppropriate(meetingId);
  } else {
    server.send(client, 'UpdatedSummaryItems', responseBody);
  }
};
