import {
  MeetingPhaseValues,
  ExpressResponse,
  MeetingTokenResponseBody,
  CreateMeetingRequest,
} from 'miter-common/SharedTypes';
import {ValidationError} from 'miter-common/SharedTypes';
import {validateExpressRequestBody} from '../endpoint-utils';
import {validateAndDeserializeDate} from 'miter-common/CommonUtil';
import {createToken} from '../../data/create-token';
import {createMeeting} from '../../data/meetings-events/create-meeting';
import httpEndpoint from '../../server-core/http/http-endpoint';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';
import {fetchLockingOrganizationId} from '../../data/people/fetch-organization';

const validateCreateMeetingRequest = (body: any): CreateMeetingRequest => {
  const expressBody = validateExpressRequestBody(body);

  if (!expressBody.title) throw new ValidationError(`Create-meeting requests require a title.`);
  if (typeof expressBody.title !== 'string') {
    throw new ValidationError(`Expected string title, got ${expressBody.title}`);
  }
  if (expressBody.goal && typeof expressBody.goal !== 'string') {
    throw new ValidationError(`Expected string goal, got ${expressBody.goal}`);
  }
  if (expressBody.phase && !MeetingPhaseValues.includes(expressBody.phase)) {
    throw new ValidationError(`Received invalid meeting phase: ${expressBody.phase}`);
  }

  // Dates need to be unserialized
  const startTime = expressBody.startTime ? validateAndDeserializeDate(expressBody.startTime) : null;
  const endTime = expressBody.endTime ? validateAndDeserializeDate(expressBody.endTime) : null;

  return {
    ...expressBody,
    startTime,
    endTime,
  } as CreateMeetingRequest;
};

export const createMeetingEndpoint = httpEndpoint(withHttpUser, async (req, res) => {
  const validBody = validateCreateMeetingRequest(req.body);

  const lockingOrganizationId = await fetchLockingOrganizationId(req.user?.organizationId);

  const meeting = await createMeeting({
    title: validBody.title,
    goal: validBody.goal || null,
    startDatetime: validBody.startTime || new Date(),
    endDatetime: validBody.endTime || new Date(),
    allDay: false,
    phase: 'NotStarted',
    zoomMeetingId: null,
    zoomNumericMeetingId: null,
    organizationId: lockingOrganizationId,
  });

  const token = await createToken({meetingId: meeting.id});

  const responseBody: MeetingTokenResponseBody = {tokenValue: token.value};
  const response: ExpressResponse = {success: true, body: responseBody};
  res.json(response);
});
