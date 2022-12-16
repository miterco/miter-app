import {Request} from 'express';
import * as uuid from 'uuid';
import {Meeting, MeetingToken} from '../../../common/SharedTypes';
import {correlateMeetingsEndpoint} from './correlate-meetings-endpoint';
import {getPrismaClient} from '../../data/prisma-client';
import {insertTestMeetingAndToken, testName} from '../../testing/generate-test-data';
import HttpError from '../../errors/HttpError';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';

const prisma = getPrismaClient();

describe('POST /api/zoom/meeting', () => {
  // Mocks.
  const response = {json: jest.fn()} as any;
  const next = jest.fn();

  // Zoom data.
  const ZoomMeetingUID = uuid.v4();
  const zoomMeetingNID = uuid.v4(); // Any random string will do.

  // ===================================================================================================================
  //                                                   TEST SETUP
  // ===================================================================================================================
  let meeting: Meeting;
  let meetingToken: MeetingToken | null;

  beforeAll(async () => {
    [meeting, meetingToken] = await insertTestMeetingAndToken(testName());
  });

  afterEach(async () => {
    next.mockClear();
  });

  // ===================================================================================================================
  //                                                DATA VALIDATION
  // ===================================================================================================================
  it('should return a "400 Bad Request" response if the ZoomMeetingUID cookie is missing', async () => {
    const request = {
      cookies: {},
      body: {meetingToken: meetingToken?.value},
      params: {zoomMeetingNID},
    } as any;
    await correlateMeetingsEndpoint(request, response, next);

    // Expect it to error out.
    expect(next.mock.calls).toHaveLength(1);
    expect(next.mock.calls[0]).toHaveLength(1);

    // Test the error.
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(HttpError);
    expect(error.message).toBe('Missing Zoom meeting UID');
    expect(error.statusCode).toBe(400);
  });

  it('should return a "400 Bad Request" response if the meetingToken is missing in the request body', async () => {
    const request = {
      cookies: {ZoomMeetingUID},
      body: {},
      params: {zoomMeetingNID},
    } as any;
    await correlateMeetingsEndpoint(request, response, next);

    // Expect it to error out.
    expect(next.mock.calls).toHaveLength(1);
    expect(next.mock.calls[0]).toHaveLength(1);

    // Test the error.
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(HttpError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Missing meeting token');
  });

  it('should error out if the meeting token does not exist', async () => {
    const request = {
      cookies: {ZoomMeetingUID},
      body: {meetingToken: 'invalid_token'},
      params: {zoomMeetingNID},
    } as any;
    await correlateMeetingsEndpoint(request, response, next);

    // Expect it to error out.
    expect(next.mock.calls).toHaveLength(1);
    expect(next.mock.calls[0]).toHaveLength(1);

    // Test the error.
    const error = next.mock.calls[0][0];
    expect(typeof error.message).toBe('string');
  });

  // ===================================================================================================================
  //                                               MEETING CORRELATION
  // ===================================================================================================================
  describe('when given valid data', () => {
    let responseData: Record<string, any>;
    let updatedMeeting: Meeting;

    beforeAll(async () => {
      const request = {
        cookies: {ZoomMeetingUID},
        body: {meetingToken: meetingToken?.value},
        params: {zoomMeetingNID},
      } as any;

      await correlateMeetingsEndpoint(request, response, next);
      updatedMeeting = await fetchMeeting(meeting.id);
    });

    it('should successfully return a JSON response', async () => {
      expect(response.json.mock.calls).toHaveLength(1);
      expect(response.json.mock.calls[0]).toHaveLength(1);

      responseData = response.json.mock.calls[0][0];
      expect(responseData?.success).toBe(true);
      expect(responseData).toHaveProperty('body');
    });

    it('should update the Zoom meeting NID in the meeting record', async () => {
      expect(updatedMeeting.zoomNumericMeetingId).toBe(zoomMeetingNID);
    });

    it('should update the Zoom meeting UID in the meeting record', async () => {
      expect(updatedMeeting.zoomMeetingId).toBe(ZoomMeetingUID);
    });
  });

  afterAll(async () => {
    await prisma.meetingToken.deleteMany({where: {value: meetingToken?.value}});
    await prisma.meeting.delete({where: {id: meeting.id}});
  });
});
