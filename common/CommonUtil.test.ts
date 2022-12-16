import {validateEmail} from './CommonUtil';

const ValidEmails = [
  'email-testing+recipient1@test.miter.co',
  'imceaex-_o=exchangelabs_ou=exchange+20administrative+20group+20+28fREDUCED23spdlt+29_cn=recipients_cn=417c8ca398REDUCEDd21df72bREDUCED-pufanwe@namprd14.prod.outlook.com',
  'sampleemailn@test.miter.co',
  'sampleemailw@test.miter.co',
  'test@test.miter.co',
  'containing-dashes-@email.co',
  'containing_lodash@some-corporation.co',
];
const InvalidEmails = ['this-is-not-an-email', 'actually-this-is-a-domain.com', '@@@@@@', '12345678', '.'];

describe('validateEmail', () => {
  it('should return false when given a value that is not a string', () => {
    const nonStringValues = [123, [], {}, null];

    for (const nonStringValue of nonStringValues) {
      expect(validateEmail(nonStringValue)).toEqual(false);
    }
  });

  it('should return true when given a valid email address', () => {
    for (const email of ValidEmails) {
      // The reason we are formatting this as an array is to get a better error message when the test fails. That way,
      // when it fails, you get something like:
      //   Expected value: true
      //   Received: ['email@address.com', false]
      expect([email, validateEmail(email)]).toContain(true);
    }
  });

  it('should return false when given a string that is not an email address', () => {
    for (const email of InvalidEmails) {
      // The reason we are formatting this as an array is to get a better error message when the test fails. That way,
      // when it fails, you get something like:
      //   Expected value: false
      //   Received: ['email@address.com', true]
      expect([email, validateEmail(email)]).toContain(false);
    }
  });
});
