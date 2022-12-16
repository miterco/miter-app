import {parseAndValidateExternalMeetingIdentifier, parseExternalMeetingIdentifier} from './endpoint-meeting-logic';

const randomUuid = '60F2CB02-C8FA-46F9-B1EA-6DB9256F581F';

test('parseExternalMeetingIdentifier', () => {
  expect(() => parseExternalMeetingIdentifier('')).toThrow();
  expect(() => parseExternalMeetingIdentifier(null)).toThrow();
  expect(() => parseExternalMeetingIdentifier(45)).toThrow();
  expect(() => parseExternalMeetingIdentifier({a: 1})).toThrow();

  expect(parseExternalMeetingIdentifier('g_abcd_12345')).toEqual({idType: 'Google', id: 'abcd_12345'});
  expect(parseExternalMeetingIdentifier('g_abcd12345')).toEqual({idType: 'Google', id: 'abcd12345'});
  expect(parseExternalMeetingIdentifier('gabcd_12345')).toEqual({idType: 'Token', id: 'gabcd_12345'});
});

test('getValidIdentifier', () => {
  // expect(() => getValidIdentifier('gabc3e')).toThrow();
  // expect(() => getValidIdentifier(randomUuid)).toThrow();

  expect(parseAndValidateExternalMeetingIdentifier('g_123abc')).toEqual({idType: 'Google', id: '123abc'});
});

// TODO Tests for getMeetingForExternalIdentifier();
