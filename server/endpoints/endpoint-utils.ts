/*
 * General utilities needed across multiple endpoints. For business logic specific
 * to meetings and the wrangling thereof, use meeting-logic.ts instead.
 */

import {ExpressRequestBody, Meeting} from 'miter-common/SharedTypes';
import {ValidationError} from 'miter-common/SharedTypes';
import {Request} from 'express';
import * as chrono from 'chrono-node';
import * as gAuth from '../google-apis/google-auth';
import {addMeetingAttendee} from '../data/people/add-meeting-attendee';
import {fetchUserByGoogleId, fetchUserByZoomId} from '../data/people/fetch-user';
import {SocketUser} from '../server-core/socket-server';
import {UserRecord} from '../server-core/server-types';
import {decryptZoomUserId} from '../server-core/server-util';
import {fetchMeeting} from '../data/meetings-events/fetch-meeting';
import {updateSummaryEmailJobsSendAfter} from '../data/jobs/summary-email-job';

// Top-level payload validation

export const validateExpressRequestBody = (body: any): ExpressRequestBody => {
  if (!body) throw new ValidationError('Received an empty Express request body.');
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`Express endpoint expected an object-type body, got ${body}.`);
  }
  return body;
};

export const validateSocketRequestBody = (body: any): NonNullable<any> => {
  if (!body) throw new ValidationError('Expected a non-empty socket request body, but received an empty one.');
  if (typeof body !== 'object') {
    throw new ValidationError(`SocketRequestBody should resolve to an object but got ${typeof body}.`);
  }
  return body;
};

// Parse text content for strings that represent dates.
// TODO this doesn't work all that well when we're dealing with the result of a prior parse,
// and probably doesn't play nice with rich text/HTML in general.
type ParsedContent = {
  original: string;
  final: string;
  firstDate: Date | null;
};
export const parseContentForDates = (content: string) => {
  const result: ParsedContent = {original: content, final: content, firstDate: null};
  const parsed = chrono.parse(content);
  if (parsed.length) {
    const entity = parsed[0];
    const replacement = `<strong class="Entity">${entity.text}</strong>`;
    result.final = content.substr(0, entity.index) + replacement + content.substr(entity.index + entity.text.length);
    result.firstDate = entity.start.date();
  }
  return result;
};

export const addMultipleSocketUsersAsAttendees = async (meetingId: string, users: SocketUser[]) => {
  const addPromises = users.map(user => (user.userId ? addMeetingAttendee(meetingId, user.userId) : null));
  const allSettled = await Promise.allSettled(addPromises);
  allSettled.forEach(settled => {
    if (settled.status === 'rejected') throw settled.reason;
  });
  return true;
};

/*
 * If on the summary screen and actively making changes, delay the send time of any automated summary emails.
 */
export const delayAutomatedSummaryEmailIfAppropriate = async (meetingOrId: string | Meeting) => {
  const meeting = typeof meetingOrId === 'string' ? await fetchMeeting(meetingOrId) : meetingOrId;
  if (meeting.phase === 'Ended') await updateSummaryEmailJobsSendAfter(meeting.id);
};
