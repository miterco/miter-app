import {ValidationError, SendFeedbackRequest} from 'miter-common/SharedTypes';
import {sendEmail} from '../email/email';
import {EmailMessage} from '../email/email';
import {validateSocketRequestBody} from './endpoint-utils';
import {Endpoint} from '../server-core/socket-server';
import {formatDate, validateEmailThrows} from 'miter-common/CommonUtil';
import {fetchUserByMiterId} from '../data/people/fetch-user';
import {getDisplayNameForUserRec} from '../server-core/server-util';

const validateSendFeedbackRequest = (body: any): SendFeedbackRequest => {
  const validBody = validateSocketRequestBody(body);
  validateEmailThrows(validBody.email);
  if (typeof validBody.feedback !== 'string' || !validBody.feedback.trim()) {
    throw new ValidationError(`Received a send-feedback request with invalid feedback: ${validBody.feedback}`);
  }
  return validBody;
};

export const sendFeedbackEndpoint: Endpoint = async (server, client, body, requestId) => {
  const req = validateSendFeedbackRequest(body);
  const {userId} = server.getUserForClient(client);
  const user = userId ? await fetchUserByMiterId(userId) : null;
  const name = (user && getDisplayNameForUserRec(user)) || req.email;

  const content = `<p>Name: ${name}</p><p>Email: ${req.email}</p><p>${req.feedback}</p>`;

  const emailMessage: EmailMessage = {
    from: {name, email: 'no-reply@test.miter.co'},
    to: [{email: 'feedback@test.miter.co'}],
    subject: `Miter Feedback - ${name} - ${formatDate(new Date())}`,
    html: content,
    sendBareContent: true,
  };

  try {
    await sendEmail(emailMessage);
  } catch (e) {
    throw new Error(`Failed to send feedback email: ${emailMessage}`);
  }

  server.send(client, 'DirectResponse', {}, requestId);
};
