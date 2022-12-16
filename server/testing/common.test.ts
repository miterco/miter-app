/*
 * Tests for things in the common module. Leaving in server so we can run one battery of tests easily.
 */

import { validateAndDeserializeDate } from "miter-common/CommonUtil";

const nowDate = new Date();
const beforeDate = new Date('2021-08-17T15:15:05.234Z');

test('validateAndDeserializeDate: falsy inputs', () => {
  expect(() => validateAndDeserializeDate(null)).toThrow();
  expect(() => validateAndDeserializeDate('')).toThrow();
});

test('validateAndDeserializeDate: malformed inputs', () => {
  expect(() => validateAndDeserializeDate('I am not a date')).toThrow();
  expect(() => validateAndDeserializeDate(new Date('I am not a date'))).toThrow();
});

test('validateAndDeserializeDate: Date input', () => {
  expect(validateAndDeserializeDate(nowDate)).toEqual(nowDate);
});

test('validateAndDeserializeDate: string input', () => {
  const dateStr = nowDate.toString();
  const result = validateAndDeserializeDate(dateStr);
  expect(result.toString()).toEqual(nowDate.toString());
  expect(result.toString() !== beforeDate.toString()).toBe(true);
});
