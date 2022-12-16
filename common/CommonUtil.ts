import {URL} from 'url';
import {
  EmailRecipient,
  Goal,
  GoalType,
  GoalTypeMap,
  GoalTypeValues,
  Person,
  User,
  UserOrGuest,
  ValidationError,
} from './SharedTypes';
import {validate as uuidValidate, v4} from 'uuid';
import {validate as emailValidator_validateEmail} from 'email-validator';
import * as crypto from 'crypto';
import knownEmailProviders from './known-email-domains.json';
import {EMAILS_PATTERN} from './patterns';

export const LinkedinCompanyUrlPrefix = 'https://www.linkedin.com/company/';

export const validateEmail = (possibleEmail: any) => {
  if (typeof possibleEmail !== 'string') return false;
  return EMAILS_PATTERN.test(possibleEmail);
};

export const validateEmailThrows = (possibleEmail: string | null | undefined) => {
  if (!validateEmail(possibleEmail)) throw new ValidationError(`Received an invalid email: ${possibleEmail}`);
  return possibleEmail;
};

export const isWorkEmail = (emailAddress: string) => {
  validateEmailThrows(emailAddress);

  const [_, domain] = emailAddress.split('@');

  return isWorkDomain(domain);
};

export const isWorkDomain = (domainName: string) => {
  return !knownEmailProviders.includes(domainName);
};

export const getEmailDomain = (emailAddress: string) => {
  return emailAddress.substring(emailAddress.indexOf('@') + 1);
};

// ---------------------------------------------------------------------------------------------------------------------
//                                                        URL
// ---------------------------------------------------------------------------------------------------------------------
const {REDIRECT_ALLOWED_HOSTS} = process.env;

export const isAllowedHost = (url: string, allowedHosts: string[]): Boolean => {
  if (!url) return false;

  const {host} = new URL(url);
  return allowedHosts.includes(host) || allowedHosts.includes('*');
};

export const isRedirectAllowedHost = (url: string): Boolean => {
  const allowedHosts = (REDIRECT_ALLOWED_HOSTS || '').split(',');
  return isAllowedHost(url, allowedHosts);
};

// ---------------------------------------------------------------------------------------------------------------------
//                                                      COOKIES
// ---------------------------------------------------------------------------------------------------------------------
export const formatCookie = (cookiesObj: Record<string, string>): string => {
  const cookies = [];

  for (const cookieName in cookiesObj) {
    cookies.push(`${cookieName}=${cookiesObj[cookieName]}`);
  }

  return cookies.join('; ');
};

// ---------------------------------------------------------------------------------------------------------------------
//                                          GOALS: ENCODE, DECODE, VALIDATE
// ---------------------------------------------------------------------------------------------------------------------

// Delimiters/indicators for enumerated types in the db to distinguish them
// from plain old strings.
// TODO deprecated -- remove after we pull this stuff out of the db or enough time passes
export const EnumTypeStart = '[[';
export const EnumTypeEnd = ']]';
const validateLegacyGoal = (legacyGoal: string): Goal => {
  const isActuallyLegacyGoal = legacyGoal.startsWith(EnumTypeStart) && legacyGoal.endsWith(EnumTypeEnd);
  if (isActuallyLegacyGoal) {
    // We have a legacy predefined / enumerated value. Make sure it's valid.
    const enumGoal = validateGoalType(
      legacyGoal.substring(EnumTypeStart.length, legacyGoal.length - EnumTypeEnd.length)
    );
    return {type: enumGoal};
  } else {
    return {type: 'Other', customText: legacyGoal};
  }
};

export const validateGoalType = (input: any): GoalType => {
  if (typeof input !== 'string') throw new ValidationError(`Got a missing or invalidly-typed goal type: ${input}`);
  if (!GoalTypeValues.includes(input as GoalType)) throw new ValidationError(`Got an invalid goal type: ${input}`);
  return input as GoalType;
};

const _validateObjectAsGoal = (decodedJson: any): Goal => {
  if (typeof decodedJson !== 'object') throw new ValidationError(`Expected a Goal object, got ${decodedJson}`);
  validateGoalType(decodedJson.type);
  if (!undefinedOrString(decodedJson, 'customText')) {
    throw new ValidationError(`Got a goal with missing or invalid custom text: ${decodedJson.customText}`);
  }
  return decodedJson;
};

export const validateAndDecodeGoal = (input: any): Goal | null => {
  if (!input) return null;

  // TODO logic (incl. extra function) is complicated by backward-compatibility with old format. Remove eventually.
  if (typeof input === 'object') return _validateObjectAsGoal(input);
  if (typeof input !== 'string') {
    throw new ValidationError(`Received a Goal that's neither object nor string: ${input}`);
  }
  let obj: any = null;
  try {
    obj = JSON.parse(input);
  } catch {
    return validateLegacyGoal(input);
  }
  return _validateObjectAsGoal(obj);
};

export const encodeGoal = (unvalidatedGoal: {type: string; customText?: string}): string => {
  validateGoalType(unvalidatedGoal.type);
  return JSON.stringify(unvalidatedGoal);
};

export const getGoalTypeString = (goal: Goal): string => {
  return GoalTypeMap[goal.type].string;
};

export const getGoalString = (goal: any): string => {
  try {
    const validGoal = validateAndDecodeGoal(goal);
    if (!validGoal) return '';
    if (validGoal.type === 'Other') return validGoal.customText || '';
    return getGoalTypeString(validGoal);
  } catch (e) {
    console.error(e);
    return '';
  }
};

export const validatePerson = (obj: any): Person => {
  if (!obj) throw new ValidationError(`Expected a Person, got something falsy.`);
  if (typeof obj !== 'object') throw new ValidationError(`Expected a Person object, got ${obj}`);

  if (obj.id && typeof obj.id !== 'string') {
    throw new ValidationError(`Person.id must be undefined, null, or string; got ${typeof obj.id}`);
  }

  if (obj.displayName && typeof obj.displayName !== 'string') {
    throw new ValidationError(`Person.displayName must be undefined or string; got ${typeof obj.displayName}`);
  }

  if (obj.initials && typeof obj.initials !== 'string') {
    throw new ValidationError(`Person.initials must be undefined or string; got ${typeof obj.initials}`);
  }

  if (obj.picture && typeof obj.picture !== 'string') {
    throw new ValidationError(`Person.picture must be undefined or string; got ${typeof obj.picture}`);
  }

  return obj;
};

export const validateUser = (obj: any): User => {
  if (!obj) throw new ValidationError(`Expected a User, got something falsy.`);
  if (typeof obj.displayName !== 'string' && obj.displayName !== null) {
    throw new ValidationError(`User.displayName must be string or null; got ${typeof obj.displayName}`);
  }
  if (typeof obj.initials !== 'string') {
    throw new ValidationError(`User.initials must a string; got ${typeof obj.initials}`);
  }
  if (obj.picture && typeof obj.picture !== 'string') {
    throw new ValidationError(`User.picture must be string; got ${typeof obj.picture}`);
  }
  if (obj.wipFeature && typeof obj.wipFeature !== 'string') {
    throw new ValidationError(`User.wipFeature must be string when present; got ${obj.wipFeature}`);
  }
  return obj;
};

export const validateUserOrGuest = (obj: any): UserOrGuest => {
  if (Object.keys(obj).length === 0) return obj;
  return validateUser(obj);
};

// Validation Helpers

export const nullOrType = (obj: any, key: string, type: string) => {
  if (obj[key] === null) return true;
  if (!(typeof obj[key] === type)) {
    return false;
  }
  return true;
};

export const undefinedOrType = (obj: any, key: string, type: string) => {
  if (obj[key] === undefined) return true;
  if (!(typeof obj[key] === type)) {
    return false;
  }
  return true;
};

export const falsyOrType = (obj: any, key: string, type: string) => {
  if (obj[key] === undefined) return true;
  if (!(typeof obj[key] === type)) {
    return false;
  }
  return true;
};

export const undefinedOrString = (obj: any, key: string) => {
  if (obj[key] === undefined) return true;
  if (typeof obj[key] === 'string') return true;
  return false;
};

export const falsyOrString = (obj: any, key: string) => {
  if (!obj[key]) return true;
  if (!(typeof obj[key] === 'string')) {
    return false;
  }
  return true;
};

export const nullOrString = (obj: any, key: string) => {
  return nullOrType(obj, key, 'string');
};

export const nullOrDate = (obj: any, key: string) => {
  if (!obj[key]) {
    obj[key] = null;
  } else if (!(obj[key] instanceof Date)) {
    return false;
  }
  return true;
};

export const isValidDate = (possibleDate: any) => {
  return Boolean(possibleDate && possibleDate instanceof Date && !isNaN(possibleDate as any));
};

export const isValidUuid = (possibleUuid: any, canBeFalsy: boolean = false) => {
  if (canBeFalsy && !possibleUuid) return true;
  if (typeof possibleUuid !== 'string') return false;
  return uuidValidate(possibleUuid);
};

export const uuid = v4;

//-------------------------------------------------------------------------------------------------
//                                       ENCRYPTION
//-------------------------------------------------------------------------------------------------

/**
 * Encrypts a text using the provided key.
 *
 * @param text - The text to be encrypted.
 * @param key - A 16-byte key to encrypt the text with.
 * @param iv - Initialization vector. 16 bytes.
 * @returns the encrypted text.
 */
export const encrypt = (text: string, key: string, iv: string): string => {
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  const encryptedText = cipher.update(text, 'utf8', 'hex');

  return encryptedText + cipher.final('hex');
};

/**
 * Deciphers a text with the provided key.
 *
 * @param hash - The encrypted text.
 * @param key - The 16-byte key used to encrypt the text.
 * @param iv - Initialization vector.
 * @returns the decrypted text.
 */
export const decrypt = (hash: string, key: string, iv: string): string => {
  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  const decryptedText = decipher.update(hash, 'hex', 'utf8');

  return decryptedText + decipher.final('utf8');
};

//-------------------------------------------------------------------------------------------------
//                             DATE FORMATTING AND SERIALIZATION
//-------------------------------------------------------------------------------------------------

export const validateAndDeserializeDate = (possibleDate: any): Date => {
  if (!possibleDate) throw new ValidationError('Date validator received a falsy input.');

  if (isValidDate(possibleDate)) return possibleDate;

  if (typeof possibleDate !== 'string') {
    throw new ValidationError(`Date validator expected a string or Date, got ${possibleDate}.`);
  }

  const date = new Date(possibleDate);
  if (!isValidDate(date)) {
    throw new ValidationError(`Date validator got a string that can't be converted to a date: ${possibleDate}`);
  }

  return date;
};

/*
 * Format a date into a readable string. Some options:
 * date: If true, include the month and the day of the month, like 'Mar 6'.
 * day: If true *and if date is true*, include the weekday name, like 'Thu, Mar 6'
 * time: Include the timne
 *
 * If no options are true or only day is true, a short date string like 3/6/2021.
 * TODO the thing where day: true on its own does nothing is weird.
 */
export const formatDate = (date: Date | null | undefined, opts?: {date?: boolean; day?: boolean; time?: boolean}) => {
  if (!date) return '';
  const datestampFormatter = new Intl.DateTimeFormat(
    [],
    opts && Object.keys(opts).length
      ? {
          weekday: opts?.date && opts?.day ? 'short' : undefined,
          month: opts?.date ? 'short' : undefined,
          day: opts?.date ? 'numeric' : undefined,
          hour: opts?.time ? 'numeric' : undefined,
          minute: opts?.time ? 'numeric' : undefined,
        }
      : {month: 'short', day: 'numeric', weekday: 'short'}
  );
  const formatted = datestampFormatter.format(date);
  return opts?.time ? formatted.replace(/( [AP]M)$/, match => match.trim().toLowerCase()) : formatted;
};

/**
 * Given a date and a timezone offset, return the UTC time for the user start of day.
 *
 * @param date - The date for which the start of day is calculated.
 * @param tzOffset - The offset of the user timezone in seconds with respect to UTC.
 *
 * @returns the start of day for the user at the given date.
 */
export const getStartOfDay = (date: Date, tzOffset: number | null) => {
  // If no timezone is provided, do nothing.
  if (tzOffset === null) return date;

  const startOfDay = new Date(date);

  startOfDay.setUTCHours(0, 0, 0);
  startOfDay.setTime(startOfDay.getTime() + tzOffset * 1000); // Add the timezone offset.

  return startOfDay;
};

/**
 * Given a date and a timezone offset, return the UTC time for the user end of day.
 *
 * @param date - The date for which the end of day is calculated.
 * @param tzOffset - The offset of the user timezone in seconds with respect to UTC.
 *
 * @returns the end of day for the user at the given date.
 */
export const getEndOfDay = (date: Date, tzOffset: number | null) => {
  // If no timezone is provided, do nothing.
  if (tzOffset === null) return date;

  const endOfDay = new Date(date);

  endOfDay.setUTCHours(23, 59, 59);
  endOfDay.setTime(endOfDay.getTime() + tzOffset * 1000); // Add the timezone offset.

  return endOfDay;
};

export const getStartOfHour = (date: Date) => {
  const startOfHour = new Date(date);

  startOfHour.setMinutes(0, 0, 0);

  return startOfHour;
};

export const getSuffixFromLinkedinCompanyUrl = (url: string | null) => {
  if (!url) return null;
  if (!url.startsWith(LinkedinCompanyUrlPrefix)) throw new Error(`Malformed LinkedIn URL, Wrong Prefix: ${url}`);
  const urlSuffix = url.substring(LinkedinCompanyUrlPrefix.length);
  if (urlSuffix.indexOf('/') !== -1) throw new Error(`Malformed LinkedIn URL, Extra /: ${url}`);
  if (urlSuffix.toLowerCase() !== urlSuffix) throw new Error(`Malformed LinkedIn URL, Upper Case: ${url}`);
  return urlSuffix;
};

// Time constants.
export const Seconds = 1000;
export const Minutes = 60 * Seconds;
export const Hours = 60 * Minutes;
export const Days = 24 * Hours;
export const Weeks = 7 * Days;

export const getDaysAgo = (n: number) => new Date(Date.now() - n * Days);
export const getDaysFromNow = (n: number) => new Date(Date.now() + n * Days);

// -------------------------------------------------------------------------------------------------
//                                               STRINGS
// -------------------------------------------------------------------------------------------------

export const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};
