import {FullPersonWithEmail} from '../server-core/server-types';
import {EmailMessage, sendEmail} from './email';
import {v4 as uuid} from 'uuid';

const testDomain = 'miter.co';
const testFromAddress = 'email-testing';
const baseToAddress = 'email-testing';

const generateFakePeople = (count: number, maxBadAddresses: number = 0): FullPersonWithEmail[] => {
  const result: FullPersonWithEmail[] = [];
  for (let i = 0; i < count; i++) {
    const emailAddr = maxBadAddresses
      ? `${baseToAddress}+recipient${i}`
      : `${baseToAddress}+recipient${i}@${testDomain}`;
    if (maxBadAddresses) maxBadAddresses--;

    result.push({
      id: uuid(),
      serviceId: uuid(),
      displayName: `Test Recipient ${i}`,
      emailAddressId: uuid(),
      email: emailAddr,
    });
  }
  return result;
};

describe('sendEmail', () => {
  it('Should send a basic "bare" email', async () => {
    const msg: EmailMessage = {
      to: generateFakePeople(Math.ceil(Math.random() * 4)),
      from: {name: 'Miter Testing', email: `${testFromAddress}@${testDomain}`},
      subject: 'Jest Test: Basic Email',
      html: 'Hello, <i>world</i>.',
      sendBareContent: true,
    };

    await expect(sendEmail(msg)).resolves.toBe(true);
  });

  it('should throw when passed an invalid email address', async () => {
    const msg: EmailMessage = {
      to: generateFakePeople(Math.ceil(Math.random() * 4), 1),
      from: {name: 'Miter Testing', email: `${testFromAddress}@${testDomain}`},
      subject: 'Jest Test: Bad Address - Should Not Send',
      html: 'Hello, <i>world</i>.',
    };

    await expect(sendEmail(msg)).rejects.toThrow();
  });

  it('should throw when email body (html) is empty', async () => {
    const msg: EmailMessage = {
      to: generateFakePeople(Math.ceil(Math.random() * 4), 1),
      from: {name: 'Miter Testing', email: `${testFromAddress}@${testDomain}`},
      subject: 'Jest Test : Missing Body - Should Not Send',
      html: '',
    };

    await expect(sendEmail(msg)).rejects.toThrow();
  });

  it('should throw when subject is empty', async () => {
    const msg: EmailMessage = {
      to: generateFakePeople(Math.ceil(Math.random() * 4), 1),
      from: {name: 'Miter Testing', email: `${testFromAddress}@${testDomain}`},
      subject: '',
      html: 'Some content',
      sendBareContent: true,
    };

    await expect(sendEmail(msg)).rejects.toThrow();
  });
});
