import {nullOrString, falsyOrString, validateAndDeserializeDate} from 'miter-common/CommonUtil';
import {
  SocketRequestBody,
  CreateSummaryItemRequest,
  ValidationError,
  ItemTypeValues,
  UnsavedSummaryItem,
  UpdatedSummaryItemsResponse,
} from 'miter-common/SharedTypes';
import {createSummaryItem} from '../../data/notes-items/create-summary-item';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {Endpoint} from '../../server-core/socket-server';
import {delayAutomatedSummaryEmailIfAppropriate} from '../endpoint-utils';

const validateUnsavedSummaryItem = (body: any): UnsavedSummaryItem => {
  if (!body) throw new ValidationError('New summary item request is missing a body.');
  if (body.targetDate !== null) body.targetDate = validateAndDeserializeDate(body.targetDate);
  if (!nullOrString(body, 'noteId')) {
    throw new ValidationError(`Expected new summary item's note ID to be null or string, got ${body.noteId}`);
  }
  if (!(nullOrString(body, 'itemType') && ItemTypeValues.includes(body.itemType))) {
    throw new ValidationError(`New summary item has invalid item type ${body.itemType}.`);
  }
  if (!nullOrString(body, 'itemText')) {
    throw new ValidationError(`New summary item has missing or invalid item text ${body?.itemText}.`);
  }
  if (!falsyOrString(body, 'itemText2')) {
    throw new ValidationError(`New summary item has missing or invalid secondary item text ${body?.itemText2}.`);
  }

  if (body.id) throw new ValidationError(`Unsaved summary items should not have an ID.`);
  if (body.meetingId) throw new ValidationError('Unsaved summary items should not have a summary ID.');
  if (body.timestamp) throw new ValidationError(`Unsaved summary items should not have a timestamp.`);
  if (body.createdBy) throw new ValidationError(`Unsaved summary items should not have a createdBy.`);

  if (!falsyOrString(body, 'topicId')) {
    throw new ValidationError(`Expected new summary item's topic ID to be falsy or string, got ${body.topicId}`);
  }

  return body as UnsavedSummaryItem;
};

const validateCreateSummaryItemRequest = (body: SocketRequestBody): CreateSummaryItemRequest => {
  if (!body) throw new ValidationError('Received empty body while creating summary item.');
  const summaryItem = validateUnsavedSummaryItem(body.summaryItem);
  if (body.outsideOfMeeting !== undefined && typeof body.outsideOfMeeting !== 'boolean') {
    throw new ValidationError('CreateSummaryItemRequest had a non-boolean value for outsideOfMeeting.');
  }
  return {summaryItem, outsideOfMeeting: Boolean(body.outsideOfMeeting)};
};

export const createSummaryItemEndpoint: Endpoint = async (server, client, body) => {
  const {summaryItem: unsavedItem, outsideOfMeeting} = validateCreateSummaryItemRequest(body);
  const meetingId = outsideOfMeeting ? null : server.getExistingChannel(client);
  const meeting = meetingId ? await fetchMeeting(meetingId) : null;

  const itemToSave = {
    ...unsavedItem,
    meetingId: meeting?.id || null,
    createdBy: server.getUserForClient(client).userId,
  };

  const item = await createSummaryItem(itemToSave);
  const payload: UpdatedSummaryItemsResponse = {created: [item]};

  if (meeting) {
    // Item is attached to a meeting; broadcast changes to everyone in the meeting.
    server.broadcast(server.getExistingChannel(client), 'UpdatedSummaryItems', payload);

    await delayAutomatedSummaryEmailIfAppropriate(meeting);
  } else {
    // No meeting — it's a standalone ("personal") item.
    server.send(client, 'UpdatedSummaryItems', payload);
  }

  // NOTE: While the createSummaryItem() data function will associated a note with a summary item, we don't expect
  // the endpoint to do so--there's no "back-association" to notes when creating summary items from scratch. So,
  // no need to broadcast any note-related stuff here.
};
