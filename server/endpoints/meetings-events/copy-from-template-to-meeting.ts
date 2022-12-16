import {isValidUuid} from 'miter-common/CommonUtil';
import {ExpressResponse} from 'miter-common/SharedTypes';
import {fetchMeetingByToken} from '../../data/fetch-token';
import {fetchTemplate} from '../../data/meetings-events/fetch-template';
import {copyTopicsFromTemplateToMeeting} from '../../data/topics/copy-topics-from-template-to-meeting';
import httpEndpoint from '../../server-core/http/http-endpoint';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';

const templateId = 'c7a7b80e-6fe9-4fde-9b6d-7996306eb0de';

export const copyFromTemplateToMeetingEndpoint = httpEndpoint(withHttpUser, async (req, res) => {
  const token = req.params.meetingToken;
  if (!req?.user || !req?.user.loginEmail.includes('@test.miter.co')) {
    throw new Error('You must be logged in to use this endpoint');
  }
  if (!token) throw new Error('Meeting token not provided');
  if (!isValidUuid(token)) throw new Error(`Token provied: ${token} is not a valid UUID`);

  const template = await fetchTemplate(templateId);

  const meeting = await fetchMeetingByToken(token);
  if (!meeting) throw new Error(`Meeting Token: ${token}`);

  await copyTopicsFromTemplateToMeeting(template.id, meeting.id, true);

  const responseBody = {message: 'Success!'};
  const response: ExpressResponse = {success: true, body: responseBody};
  res.json(response);
});
