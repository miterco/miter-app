import sgMail from '@sendgrid/mail';
import juice from 'juice';
import {validateEmail} from 'miter-common/CommonUtil';
import {EmailRecipient, ValidationError} from 'miter-common/SharedTypes';
import {renderContentTemplate} from './content-templates';

if (!process.env.SENDGRID_API_KEY) throw 'Missing environment variable: SENDGRID_API_KEY';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Support for safe testing without spamming everyone. Unless ENABLE_EXTERNAL_EMAIL is set to true,
// we only email @test.miter.co addresses and anyone in the EMAIL_WHITELIST env variable.
const externalEnabled: boolean = process.env.ENABLE_EXTERNAL_EMAIL === 'true';
const emailWhitelist = externalEnabled ? null : JSON.parse(process.env.EMAIL_WHITELIST || '[]');

export type EmailMessage = {
  to: EmailRecipient[];
  from: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  sendBareContent?: boolean;
  width?: number;
};

type ValidAndInvalidRecipients = {valid: EmailRecipient[]; invalid: EmailRecipient[]};

const isPermittedRecipient = (emailAddress: string) => {
  if (externalEnabled) return true;
  if (emailWhitelist.includes(emailAddress)) return true;
  if (emailAddress.endsWith('@test.miter.co')) return true;
  return false;
};

const validateRecipientList = (recipients: EmailRecipient[]): ValidAndInvalidRecipients => {
  if (recipients.length === 0) throw 'Email function received an empty recipient list.';
  if (recipients.length > 100) throw `${recipients.length} email recipients supplied, exceeds max limit of 100`;

  const result: ValidAndInvalidRecipients = {valid: [], invalid: []};
  recipients.forEach(recipient => {
    const recipientCopy: EmailRecipient = {...recipient};
    if (validateEmail(recipientCopy.email)) {
      if (isPermittedRecipient(recipient.email)) {
        result.valid.push(recipientCopy);
      } else {
        console.warn(`Dropping recipient ${recipientCopy.email} for testing safety.`);
      }
    } else {
      result.invalid.push(recipientCopy);
    }
  });

  return result;
};

const validateEmailMessage = (msg: EmailMessage): {msg: EmailMessage; finalRecipients: EmailRecipient[]} => {
  const validatedTo = validateRecipientList(msg.to);
  if (validatedTo.invalid.length) {
    // For now we're just bailing out wholesale. Opportunity to do better handling later.
    throw new ValidationError(`Tried to send email to invalid email addresses: ${JSON.stringify(validatedTo.invalid)}`);
  }
  if (!validatedTo.valid.length) {
    throw new ValidationError(`Tried to send email but eliminated all the recipients. Did you leave the safety on?`);
  }

  if (!validateEmail(msg.from.email)) {
    throw new ValidationError(`Tried to send email from an invalid address: ${msg.from.email}`);
  }

  return {msg, finalRecipients: validatedTo.valid};
};

export const sendEmail = async (msg: EmailMessage) => {
  const {finalRecipients} = validateEmailMessage(msg);
  const finalHtml = msg.sendBareContent
    ? msg.html
    : juice(
        await renderContentTemplate('html-email-base', {htmlContent: msg.html, width: msg.width || 600}, [
          'html-email-base-css',
        ])
      );

  const payload: EmailMessage = {...msg, html: finalHtml, to: finalRecipients};

  try {
    const result = await sgMail.send(payload);
    if (!result.length) throw 'Returned an empty result from SendGrid.';
    if (result[0].statusCode !== 202) throw `Received a non-success status code from SendGrid: ${result[0].statusCode}`;
    return true;
  } catch (error: any) {
    console.log(error);
    console.dir(error.response.body.errors);
    throw 'Received an error from SendGrid.';
  }
};
