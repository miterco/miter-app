/*
 * Note that validators always return validated (and sometimes transformed)
 * versions of their input, but may also modify that input in place for the sake
 * of simplicity (and maybe performance?). I am not 100% sure that's not a good
 * idea.
 */

import {
  falsyOrString,
  isValidUuid,
  nullOrString,
  validateAndDeserializeDate,
  validatePerson,
} from 'miter-common/CommonUtil';
import {
  AddressBookPerson,
  AllNotesResponse,
  BulkMeetingResponse,
  InvitesSentResponse,
  ItemTypeValues,
  Meeting,
  MeetingPhase,
  MeetingPhaseValues,
  MeetingResponse,
  MeetingTokenResponseBody,
  MeetingWithTokenValue,
  Note,
  PendingMeetingPhaseChangeResponse,
  PeopleResponse,
  ProtocolItem,
  RelevantPeopleResponse,
  ResponseBody,
  SummaryItem,
  SummaryItemsResponse,
  SummaryItemsWithContextResponse,
  SummaryItemWithContext,
  TaskProgressValues,
  Topic,
  TopicsResponse,
  UpdatedNotesResponse,
  UpdatedSummaryItemsResponse,
  ValidationError,
} from 'miter-common/SharedTypes';

// --------------------------------------------------------------------------------------------------------------------
//                                                    NOTES
// --------------------------------------------------------------------------------------------------------------------
export const validateNote = (json: any): Note => {
  // TODO not checking Meeting ID or timestamp--we should remove them from this
  // type since we don't need them client-side.
  if (!json) throw new ValidationError('Expected a Note, got something falsy.');
  if (typeof json.id !== 'string') throw new ValidationError('Received an apparent Note without an ID.');
  if (!isValidUuid(json.id)) throw new ValidationError(`Got a note with a non-UUID ID: ${json.id}`);
  if (!nullOrString(json, 'createdBy')) {
    throw new ValidationError(`Got a note with invalid createdBy: ${json.createdBy}`);
  }
  if (typeof json.itemText !== 'string') {
    throw new ValidationError(`Got a note with missing or invalid text: ${json.itemText}`);
  }
  if (!nullOrString(json, 'systemMessageType')) {
    throw new ValidationError(`Got a note with missing or non-string system-message type: ${json.systemMessagetype}`);
  }
  if (typeof json.itemType !== 'string' || !ItemTypeValues.includes(json.itemType)) {
    throw new ValidationError(`Got a note with missing or invalid item type: ${json.itemType}`);
  }
  if (!isValidUuid(json.topicId, true)) throw new ValidationError(`Got a note with invalid topic ID: ${json.topicId}`);
  if (json.targetDate) json.targetDate = validateAndDeserializeDate(json.targetDate);
  return json;
};

const validateArray = <T>(json: any, itemValidator: (obj: any) => T): T[] => {
  if (!json) throw new ValidationError(`Expected an array, got something falsy.`);
  if (!Array.isArray(json)) throw new ValidationError(`Expected an array, got ${json}`);
  return json.map(obj => itemValidator(obj));
};

const validateObjectWithId = (json: any): {id: string} => {
  if (!isValidUuid(json.id)) throw new ValidationError(`Received a deleted object without a valid ID.`);
  return json;
};

export const validateNotes = (body: ResponseBody): AllNotesResponse => {
  if (!body) throw new ValidationError(`Expected notes, got an empty body.`);
  return {notes: validateArray<Note>(body.notes, validateNote)};
};

export const validateUpdatedNotes = (body: ResponseBody): UpdatedNotesResponse => {
  if (!body) throw new ValidationError('Received an updated-notes response without a body.');
  if (!(body.changed || body.deleted || body.created)) throw new ValidationError('Received update-notes with no data.');
  const created = body.created ? validateArray<Note>(body.created, validateNote) : undefined;
  const changed = body.changed ? validateArray<Note>(body.changed, validateNote) : undefined;
  const deleted = body.deleted ? validateArray<{id: string}>(body.deleted, validateObjectWithId) : undefined;

  return {created, changed, deleted};
};

// --------------------------------------------------------------------------------------------------------------------
//                                                   TOPICS
// --------------------------------------------------------------------------------------------------------------------
export const validateTopic = (json: any): Topic => {
  if (!json) throw new ValidationError('Expected a Topic, got something falsy.');
  if (!isValidUuid(json.id)) throw new ValidationError(`Got a Topic with an invalid ID: ${json.id}`);
  if (!isValidUuid(json.meetingId)) {
    throw new ValidationError(`Got a Topic with an invalid meeting ID: ${json.meetingId}`);
  }
  if (!json.text || typeof json.text !== 'string') {
    throw new ValidationError(`Got a Topic with mistyped or empty text: ${json.text}`);
  }
  if (json.order && typeof json.order !== 'number') {
    throw new ValidationError(`Got a Topic with mistyped order: ${json.order}`);
  }
  // TODO verify this matches final state of Topic interface.

  return json;
};

export const validateTopicsResponse = (body: ResponseBody): TopicsResponse => {
  if (!body) throw new ValidationError(`Expected a socket response with topics in it; got something falsy.`);
  return {topics: validateArray<Topic>(body.topics, validateTopic)};
};

// --------------------------------------------------------------------------------------------------------------------
//                                                SUMMARY ITEMS
// --------------------------------------------------------------------------------------------------------------------
export const validateSummaryItem = (json: any): SummaryItem => {
  // TODO not checking summary ID or timestamp; we should remove them from this
  // since we don't need them client-side.
  if (!json) throw new ValidationError('Expected a SummaryItem or Task, got something falsy.');
  if (typeof json.id !== 'string') throw new ValidationError('Received an apparent summary item without an ID.');
  if (!isValidUuid(json.id)) throw new ValidationError(`Got a summary item with a non-UUID ID: ${json.id}`);
  if (!nullOrString(json, 'createdBy')) {
    throw new ValidationError(`Got a summary item with invalid createdBy: ${json.createdBy}`);
  }
  if (!isValidUuid(json.noteId, true)) {
    throw new ValidationError(`Got a summary item with invalid note ID: ${json.topicId}`);
  }
  if (!isValidUuid(json.topicId, true)) {
    throw new ValidationError(`Got a summary item with invalid topic ID: ${json.topicId}`);
  }
  if (json.type === 'Standard' && typeof json.itemText !== 'string') {
    throw new ValidationError(`Got a summary item with missing or invalid text: ${json.itemText}`);
  }
  if (!falsyOrString(json, 'itemText2')) {
    throw new ValidationError(`Got a summary item with invalid secondary text: ${json.itemText2}`);
  }
  if (json.targetDate) json.targetDate = validateAndDeserializeDate(json.targetDate);
  if (!nullOrString(json, 'itemType') || !ItemTypeValues.includes(json.itemType)) {
    throw new ValidationError(`Got a summary item with invalid item type: ${json.itemType}`);
  }
  if (json.taskProgress && !TaskProgressValues.includes(json.taskProgress)) {
    throw new ValidationError(`Summary item with invalid task progress value: ${json.taskProgress}`);
  }

  return json;
};

export const validateTask = (json: any): SummaryItem => {
  const summaryItem = validateSummaryItem(json);
  if (summaryItem.itemType !== 'Task') {
    throw new ValidationError(`Expected a task, got another summary-item type: ${summaryItem.itemType}`);
  }

  return summaryItem;
};

export const validateSummaryItemsResponse = (body: ResponseBody | null | undefined): SummaryItemsResponse => {
  if (!body) throw new ValidationError('Expected AllSummaryItemsResponse, got something falsy.');

  return {
    summaryItems: validateArray<SummaryItem>(body.summaryItems, validateSummaryItem),
  };
};

export const validateUpdatedSummaryItemsResponse = (body: ResponseBody | undefined): UpdatedSummaryItemsResponse => {
  if (!body) throw new ValidationError('Received updated-items response with no body.');
  if (!(body.changed || body.created || body.deleted)) {
    throw new ValidationError('Received an updated-items response with no data.');
  }

  const created = body.created ? validateArray<SummaryItem>(body.created, validateSummaryItem) : undefined;
  const changed = body.changed ? validateArray<SummaryItem>(body.changed, validateSummaryItem) : undefined;
  const deleted = body.deleted ? validateArray<{id: string}>(body.deleted, validateObjectWithId) : undefined;

  return {created, changed, deleted};
};

export const validateSummaryItemWithContext = (json: any): SummaryItemWithContext => {
  if (!json) throw new ValidationError('Expected a SummaryItemWithMeeting, got something falsy.');
  const summaryItem = validateSummaryItem(json.summaryItem);
  const meeting = json.meeting === null ? null : validateMeetingWithTokenValue(json.meeting);
  const topic = json.topic ? validateTopic(json.topic) : null;
  const owner = json.owner ? validatePerson(json.owner) : undefined;
  return {summaryItem, meeting, topic, owner};
};

export const validateSummaryItemsWithContextResponse = (
  body: ResponseBody | undefined
): SummaryItemsWithContextResponse => {
  if (!body) throw new ValidationError('Expected SummaryItemsWithMeetingsResponse, got something falsy.');

  return {
    summaryItems: validateArray<SummaryItemWithContext>(body.summaryItems, validateSummaryItemWithContext),
  };
};

// --------------------------------------------------------------------------------------------------------------------
//                                                    MEETINGS
// --------------------------------------------------------------------------------------------------------------------
const _validateMeetingHelper = (body: any): any => {
  if (!body) throw new ValidationError('validateMeeting got an empty or nonexistent meeting.');
  if (!isValidUuid(body.currentTopicId, true)) {
    throw new ValidationError(`Got a meeting with invalid current topic ID: ${body.currentTopicId}`);
  }
  if (!nullOrString(body, 'title')) throw new ValidationError(`Got a meeting with invalid title: ${body.title}`);
  if (!nullOrString(body, 'goal')) throw new ValidationError(`Got a meeting with invalid goal: ${body.goal}`);
  if (body.startDatetime) body.startDatetime = validateAndDeserializeDate(body.startDatetime);
  if (body.endDatetime) body.endDatetime = validateAndDeserializeDate(body.endDatetime);
  return body;
};

export const validateMeeting = (body: any): Meeting => {
  const meeting = _validateMeetingHelper(body);
  if (!isValidUuid(meeting.id)) throw new ValidationError(`Got a meeting with missing or invalid ID: ${meeting.id}`);
  return meeting;
};

export const validateMeetingWithTokenValue = (body: any): MeetingWithTokenValue => {
  const meeting = _validateMeetingHelper(body);
  if (typeof meeting.tokenValue !== 'string') {
    throw new ValidationError('Expected MeetingWithTokenValue lacks a valid token value.');
  }
  return meeting;
};

export const validateMeetingResponse = (body: ResponseBody): MeetingResponse => {
  if (!body) throw new ValidationError("validateMeeting didn't receive a response body.");
  if (body.meeting) return {meeting: validateMeeting(body.meeting)};
  if (typeof body.error !== 'string') {
    throw new ValidationError('MeetingResponse lacked a non-null meeting AND an error string.');
  }
  if (body.errorCode !== undefined && typeof body.errorCode !== 'number') {
    throw new ValidationError(`Error-based MeetingResponse has defined non-numeric errorCode of ${body.errorCode}`);
  }
  return {meeting: null, error: body.error, errorCode: body.errorCode};
};

export const validateBulkMeetingResponse = (body: any): BulkMeetingResponse => {
  if (!body) throw new ValidationError("validateBulkMeetingResponse didn't receive a response body.");
  return {
    meetings: validateArray<MeetingWithTokenValue>(body.meetings, validateMeetingWithTokenValue),
  };
};

export const validateMeetingTokenResponse = (body: ResponseBody | null | undefined): MeetingTokenResponseBody => {
  if (!body) throw new ValidationError('Expected a token response body, got nothing.');
  // Until we implement short tokens, explicitly validating a UUID here.
  if (!isValidUuid(body.tokenValue)) {
    throw new ValidationError(`Expected a tokenValue that's a valid UUID, but got ${body.tokenValue}.`);
  }
  return body as MeetingTokenResponseBody;
};

export const validatePendingMeetingPhaseChangeResponse = (body: ResponseBody): PendingMeetingPhaseChangeResponse => {
  if (!body) throw new ValidationError('Expected phase-change response, got something falsy.');
  if (typeof body.phase !== 'string' || !MeetingPhaseValues.includes(body.phase as MeetingPhase)) {
    throw new ValidationError(`Expected a meeting phase string, got ${body.phase}`);
  }
  if (typeof body.changeTime !== 'number') {
    // PendingMeetingPhaseChange allows this to be 'Pending' but we never
    throw new ValidationError(`Expected a phase-change timestamp, got ${body.changeTime}`);
  }
  return {phase: body.phase as MeetingPhase, changeTime: body.changeTime};
};

// --------------------------------------------------------------------------------------------------------------------
//                                                      PEOPLE
// --------------------------------------------------------------------------------------------------------------------
export const validatePeopleResponse = (body: ResponseBody): PeopleResponse => {
  if (!body) throw new ValidationError(`Expected a PeopleResponse but got nothing.`);
  if (!Array.isArray(body.people)) throw new ValidationError(`PeopleResponse requires a people array; got ${body}.`);
  body.people.forEach(input => validatePerson(input));
  return {people: body.people};
};

export const validateRelevantPeopleResponse = (body: ResponseBody): RelevantPeopleResponse => {
  if (!body) throw new ValidationError(`Expected an AllRelevantPeopleResponse but got nothing.`);
  if (!Array.isArray(body.people)) {
    throw new ValidationError(`RelevantPeopleResponse requires a people array; got ${body.people}.`);
  }
  body.people.forEach(input => validatePerson(input));
  return {people: body.people};
};

export const validateAddressBookPeople = (body: ResponseBody): AddressBookPerson[] => {
  if (!body) throw new ValidationError('Expected an UserAddressBookResponse but got nothing');
  if (!Array.isArray(body.people)) {
    throw new ValidationError(`UserAddressBookResponse requires a people array; got ${body.people}`);
  }

  for (const person of body.people) {
    if (typeof person.name !== 'string') {
      throw new ValidationError(`The person name must be a string; got ${person.name}`);
    }
    if (!person.email) throw new ValidationError('Person is missing email address');
  }

  return body.people;
};

// --------------------------------------------------------------------------------------------------------------------
//                                                     INVITES
// --------------------------------------------------------------------------------------------------------------------
export const validateInvitesSentResponse = (body: ResponseBody): InvitesSentResponse => {
  if (!body) throw new ValidationError('Expected an InvitesSentResponse but got nothing');
  if (!Array.isArray(body.succeeded)) {
    throw new ValidationError(`InvitesSentResponse requires a succeeded array; git ${body.succeeded}`);
  }
  if (!Array.isArray(body.failed)) {
    throw new ValidationError(`InvitesSentResponse requires a failed array; git ${body.failed}`);
  }

  const recipients = [...body.succeeded, ...body.failed];
  for (const recipient of recipients) {
    if (typeof recipient.email !== 'string') {
      console.error(`Expected an InvitesSentResponse but got '${recipient.email}' instead of an email address`);
    }
  }

  return {
    succeeded: body.succeeded,
    failed: body.failed,
  };
};

// --------------------------------------------------------------------------------------------------------------------
//                                                     PROTOCOLS
// --------------------------------------------------------------------------------------------------------------------
export const validateCreateProtocolItemGroupResponse = (body: ProtocolItem): ProtocolItem => {
  if (!body?.id) throw new ValidationError('Expected an CreateProtocolItemGroupResponse but got nothing');

  return body;
};
