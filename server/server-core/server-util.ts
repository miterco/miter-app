import {Response} from 'express';
import {
  DefaultPersonData,
  EmailRecipient,
  Person,
  ValidationError,
  EmailRecipientWithId,
} from 'miter-common/SharedTypes';
import {FullPersonRecord, FullPersonWithEmail, UserRecord} from './server-types';
import crypto from 'crypto';
import axios from 'axios';
import {decrypt, encrypt, isWorkEmail, toTitleCase} from 'miter-common/CommonUtil';

// =================================================================================================
//                                          DEBUGGING
// =================================================================================================

export const log = (thing: any) => {
  if (process.env.DEBUG) console.log(thing);
};

export const logPerf = (refTimestamp: number, description: string) => {
  // console.log(`Performance: ${description}\t${Date.now() - refTimestamp} ms`);
};

export const checkEnvironmentVariables = (keys: string[]) => {
  let result = true;
  keys.forEach(key => {
    if (!process.env[key]) {
      console.error(`Missing environment variable ${key}`);
      result = false;
    }
  });
  return result;
};

// =================================================================================================
//                                       GOOGLE EVENTS
// =================================================================================================

//
// As observed and (somewhat) documented, Google event IDs potentially have two parts, separated by
// an underscore:
//
// - The first part we call the Base ID. For a non-recurring meeting it's just the ID; for a recurring
//   meeting it uniquely identifies the series overall. (Recall that Google-side, there doesn't seem to
//   be a separate "master" object for a recurring meeting--that role is played by the first event in
//   the series.)
//
// - The second part we call the Coda. Codas have to do with recurrence. The easy explanation is that the
//   coda identifies the instance of the recurring meeting. The hard twist is that sometimes, changes to
//   an existing series seem to result in a coda on a thing that's not a recurring instance. (These codas
//   seem to start with an R.)
//
// For Google-created meetings, the Base ID is 26 characters. However, Google's APIs seem to allow passing in
// a custom ID, which in particular results in base IDs that begin with an underscore. There are predictable
// patterns for MS-derived and Apple-derived IDs that I'm not documenting here. Notably, we have yet to see
// an ID with additional internal underscores. Yet.
//
export const parseGoogleEventId = (googleId: string | null): {base: string; coda: string | null} | null => {
  // Basic checking of Google Standard
  // https://developers.google.com/calendar/v3/reference/events#id

  if (!googleId) return null;
  if (googleId.length < 5) {
    console.error(`Encountered GCal event ID that's too short: ${googleId}`);
  }

  const prefix = googleId.indexOf('_') === 0 ? '_' : '';
  const unprefixed = prefix ? googleId.slice(1) : googleId;
  const parts = unprefixed.split('_');

  if (parts.length === 1) {
    return {base: googleId, coda: null};
  } else if (parts.length === 2) {
    return {base: prefix + parts[0], coda: parts[1]};
  }

  console.error(`Encountered unexpectedly-formatted GCal event ID: ${googleId}`);
  return null;
};

// =================================================================================================
//                              USER & PERSON RECORD UTILITIES
// =================================================================================================

export const getDisplayNameForUserRec = (userRec: UserRecord) => {
  return userRec.displayName || userRec.firstName || userRec.lastName || DefaultPersonData.displayName || '';
};

export const getInitialsForUserRec = (userRec: UserRecord) => {
  if (userRec.firstName || userRec.lastName) {
    return `${userRec.firstName?.substr(0, 1) || ''}${userRec.lastName?.substr(0, 1) || ''}`;
  }
  if (userRec.displayName) {
    const pieces = userRec.displayName.split(' ');
    if (pieces.length) return `${pieces[0]}${pieces[1] || ''}`;
  }
  return '??';
};

export const getInitialsForPersonRec = (personRec: FullPersonRecord) => {
  if (personRec.displayName) {
    const pieces = personRec.displayName.split(' ');
    if (pieces.length) return `${pieces[0]}${pieces[1] || ''}`;
  }
  return '??';
};

export const convertUserRecordToPerson = (rec: UserRecord, includeEmail: boolean = false): Person => {
  return {
    userId: rec.id,
    displayName: getDisplayNameForUserRec(rec),
    initials: getInitialsForUserRec(rec),
    picture: rec.picture || undefined,
    email: includeEmail ? rec.loginEmail : undefined,
  };
};

export const convertUserRecordToRecipient = (rec: UserRecord): EmailRecipient => {
  return {
    name: rec.displayName || rec.firstName || rec.loginEmail,
    email: rec.loginEmail,
  };
};

export const convertUserRecordToRecipientWithId = (rec: UserRecord): EmailRecipientWithId => {
  return {
    id: rec.personId || '', // TODO: This should never be null. Right? Maybe change the UserRecord interface?
    userId: rec.id || '',
    name: rec.displayName || rec.firstName || rec.loginEmail,
    displayName: getDisplayNameForUserRec(rec),
    picture: rec.picture || undefined,
    email: rec.loginEmail,
  };
};

export const convertFullPersonRecordToRecipient = (person: FullPersonWithEmail): EmailRecipient => {
  return {
    name: person.displayName || person.email,
    email: person.email,
  };
};

export const convertFullPersonRecordToRecipientWithId = (person: FullPersonWithEmail): EmailRecipientWithId => {
  return {
    id: person.id,
    name: person.displayName || person.email,
    displayName: person.displayName || person.email,
    picture: person.picture || undefined,
    email: person.email,
  };
};

/**
 * Rank users by their email address.
 *
 * This function is used to decide which user will be the one that prevails when merging the user. Users created with
 * work email take precedence. If both or none are work accounts, the one with the calendar connection is the one to
 * keep.
 *
 * @param userA - a user record.
 * @param userB - another user record.
 *
 * @returns an array as follows [primaryUser, secondaryUser]. The first one being the primary user.
 */
export const rankUsers = (userA: UserRecord, userB: UserRecord): [UserRecord, UserRecord] => {
  const userAHasWorkEmail = isWorkEmail(userA.loginEmail);
  const userBHasWorkEmail = isWorkEmail(userB.loginEmail);

  if ((userAHasWorkEmail && !userBHasWorkEmail) || (userBHasWorkEmail && !userAHasWorkEmail)) {
    // The one with the work email takes preference.
    return userAHasWorkEmail ? [userA, userB] : [userB, userA];
  } else {
    // None have a work email, or both have work emails. The one with the calendar takes precedence.
    return userA.serviceId ? [userA, userB] : [userB, userA];
  }
};

/*
 * When we have an email but no official name, make something as name-like as possible from the email.
 * Assumes a valid email.
 */
export const approximateNameFromEmail = (email: string) => {
  return toTitleCase(email.split('@')[0].replaceAll(/[.-_]/g, ' ').trim());
};

// =================================================================================================
//                                          DATES
// =================================================================================================

//
// Given a Date in the current time zone, return a date that's the same day but at midnight UTC.
//
export const getDateAtMidnightUTC = (date: Date) => {
  const isAlreadyMidnight =
    date.getUTCHours() + date.getUTCMinutes() + date.getUTCSeconds() + date.getUTCMilliseconds() === 0;
  if (isAlreadyMidnight) return date;

  const dateWithoutTime = new Date(date.toDateString());
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(dateWithoutTime.getTime() - tzOffsetMs);
};

//
// Given a Date at midnight UTC, return midnight in the current time zone.
//
export const getLocalDateFromMidnightUTC = (utcDate: Date) => {
  const isActuallyMidnight =
    utcDate.getUTCHours() + utcDate.getUTCMinutes() + utcDate.getUTCSeconds() + utcDate.getUTCMilliseconds() === 0;
  if (!isActuallyMidnight) {
    throw new ValidationError("getLocalDateFromMidnightUTC expected a date at midnight UTC but didn't get one.");
  }

  const tzOffsetMs = utcDate.getTimezoneOffset() * 60000;
  return new Date(utcDate.getTime() + tzOffsetMs);
};

export const stripHtmlTags = (htmlStr: string | null | undefined): string => {
  // Probably not particularly robust but neither are our needs at the moment.
  if (!htmlStr) return '';
  return htmlStr.replace(/(<([^>]+)>)/gi, '');
};

export const getMeetingDatesFromCalendarDates = (
  startDate: Date | null,
  endDate: Date | null,
  startTime: Date | null,
  endTime: Date | null
) => {
  const startDatetime = startDate ?? startTime;
  const endDatetime = endDate ?? endTime;
  const allDay = Boolean(startDate);

  return {startDatetime, endDatetime, allDay};
};

// =================================================================================================
//                                     ZOOM API UTILITIES
// =================================================================================================

/**
 * Decodes the Base64 string included in the X-Zoom-App-Context header.
 *
 * After the user authorized the Zoom App through the Zoom OAuth flow, the user is redirected
 * to the redirect_url. This request includes the X-Zoom-App-Context header containing the
 * code that will be used to request a token. The header value is a JSON object encrypted using
 * AES-GCM, encoded with base64.
 *
 * After decoding the base64 string you get a string consisting of:
 *
 * 1 byte - ivLength
 * ? bytes - iv value
 * 2 bytes - aadLength
 * ? bytes - aad
 * 4 bytes - cipherTextLength
 * ? bytes - cipherText
 * 16 bytes - tag
 *
 * These values (iv, aad, cipherText and tag) will be needed to decrypt the original header
 * payload.
 *
 * This function extracts this data from the encoded and encrypted header value.
 *
 * @param context - the content of the header.
 * @returns an object containing the cipher text and the values to decrypt it.
 */
export const unpackZoomContext = (context: string): Record<string, any> => {
  // Decode base64
  let buf = Buffer.from(context, 'base64');

  // Length of the initialization vector (8 bit / 1 byte).
  const ivLength = buf.readUInt8(); // Read a byte.
  buf = buf.slice(1); // Remove the byte from the buffer.

  // Initialization vector.
  const iv = buf.slice(0, ivLength); // Read the initialization vector.
  buf = buf.slice(ivLength); // Remove the iv from the buffer.

  // Length of Additional Authenticated Data (16 bits / 2 bytes).
  const aadLength = buf.readUInt16LE(); // Read the length of the AAD.
  buf = buf.slice(2); // Remove the AAD from the buffer.

  // Additional Authenticated Data.
  const aad = buf.slice(0, aadLength); // Read the AAD.
  buf = buf.slice(aadLength); // Delete the AAD from the buffer.

  // Cipher Text Length (32 bits / 4 bytes).
  const cipherLength = buf.readInt32LE(); // Read the cipher text.
  buf = buf.slice(4); // Remove the Cipher Text from the buffer.

  // Cipher Text.
  const cipherText = buf.slice(0, cipherLength);

  // Authentication Tag.
  const tag = buf.slice(cipherLength);

  return {
    iv, // Initialization vector.
    aad, // Additional Authenticated Data.
    cipherText, // The encrypted text.
    tag, // Authentication tag.
  };
};

/**
 * Decrypts the Zoom App context.
 *
 * Zoom encrypts the value of the X-Zoom-App-Context header using Advanced Encryption Standard with
 * Galois/Counter Mode. In order to decrypt this cipher text three additional values are needed:
 *
 * iv - Initialization Vector.
 * aad - Additional Authenticated Data.
 * tag - Authentication tag.
 *
 * @param context - the decoded context from the X-Zoom-App-Context header.
 * @param secret - the Zoom App client secret.
 * @returns an object containing the user ID and meeting ID.
 */
export const decryptZoomContext = (context: string, secret: string): Record<string, any> => {
  const {iv, aad, cipherText, tag} = unpackZoomContext(context);
  const decipher = crypto
    .createDecipheriv(
      // Creates a decipher object.
      'aes-256-gcm', // Encryption method.
      crypto.createHash('sha256').update(secret).digest(), // Key used by the algorithm.
      iv // Initialization vector.
    )
    .setAAD(aad) // Additional Authenticated Data.
    .setAuthTag(tag) // Authentication Tag
    .setAutoPadding(false);

  const decrypted = <any>decipher.update(cipherText) + decipher.final(); // Decrypt the cipher-text.

  return JSON.parse(decrypted);
};

const ZoomUserIdEncryption_IV = process.env.ZOOM_TOKEN_IV;
const ZoomUserIdEncryption_Key = process.env.ZOOM_TOKEN_KEY;
if (!ZoomUserIdEncryption_IV) throw new Error('Missing ZOOM_TOKEN_IV env variable');
if (!ZoomUserIdEncryption_Key) throw new Error('Missing ZOOM_TOKEN_KEY env variable');

export const encryptZoomUserId = (id: string) => encrypt(id, ZoomUserIdEncryption_Key, ZoomUserIdEncryption_IV);

export const decryptZoomUserId = (encryptedId: string | null | undefined) => {
  if (!encryptedId) return encryptedId;

  return decrypt(encryptedId, ZoomUserIdEncryption_Key, ZoomUserIdEncryption_IV);
};

// =================================================================================================
//                                           HTTP
// =================================================================================================

/**
 * Requests a URL using our server as a proxy.
 *
 * @param url - The URL being requested.
 * @param response - An express response.
 */
export const proxy = async (url: string, response: Response) => {
  const proxiedResponse = await axios.request({method: 'get', url, responseType: 'stream'});

  proxiedResponse.data.pipe(response);
};
