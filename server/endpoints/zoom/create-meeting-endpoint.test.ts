import {Request} from 'express';
import {Meeting} from '../../../common/SharedTypes';
import {fetchMeetingByToken, isTokenValueAvailable} from '../../data/fetch-token';
import {createMeetingWithZoomIdentifiersEndpoint} from './create-meeting-endpoint';
import {getPrismaClient} from '../../data/prisma-client';
import {
  insertLockedOrganizationDomainUserAndTokens,
  insertUnlockedOrganizationDomainUserAndTokens,
} from '../../testing/generate-test-data';
import {isValidUuid, uuid} from 'miter-common/CommonUtil';

const prisma = getPrismaClient();

describe('POST /api/zoom/meeting', () => {
  // Zoom data.
  const ZoomMeetingUID = uuid();
  const zoomMeetingNID = uuid(); // Any random string will do.

  // Mocks.
  const response = {json: jest.fn()} as any;
  const next = jest.fn();

  it('should error out if the ZoomMeetingUID cookie is missing', async () => {
    const request = {
      cookies: {},
      body: {zoomMeetingNID},
      get: (headerName: string) => undefined,
    } as Request;
    await createMeetingWithZoomIdentifiersEndpoint(request, response, next);
    expect(next.mock.calls).toHaveLength(1);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid request. Missing Zoom meeting UUID');
  });

  describe('when given valid data', () => {
    const response = {json: jest.fn(), cookie: (headerName: string) => response} as any;
    const next = jest.fn();

    let responseData: Record<string, any>;
    let meeting: Meeting;

    beforeAll(async () => {
      const request = {
        cookies: {ZoomMeetingUID},
        body: {zoomMeetingNID},
        get: (headerName: string) => undefined,
        headers: {'user-agent': ''},
      } as any;

      await createMeetingWithZoomIdentifiersEndpoint(request, response, next);
    });

    it('should successfully return a JSON response', async () => {
      expect(response.json.mock.calls).toHaveLength(1);
      expect(response.json.mock.calls[0]).toHaveLength(1);

      responseData = response.json.mock.calls[0][0];
      expect(responseData?.success).toBe(true);
      expect(responseData).toHaveProperty('body');
    });

    it('should return a valid meeting token', async () => {
      const {meetingToken} = responseData.body;

      expect(responseData.body).toHaveProperty('meetingToken');
      expect(typeof meetingToken).toBe('string');
      expect(isValidUuid(meetingToken)).toBe(true);

      const tokenExistsInTheDb = !(await isTokenValueAvailable(meetingToken));
      expect(tokenExistsInTheDb).toBe(true);
    });

    it('should create a new meeting', async () => {
      meeting = await fetchMeetingByToken(responseData.body.meetingToken);

      expect(meeting).not.toBeNull();
      expect(isValidUuid(meeting.id)).toBe(true);
      expect(meeting?.phase).toBe('NotStarted');
    });

    it('should create an unlocked meeting with no user signed in', async () => {
      meeting = await fetchMeetingByToken(responseData.body.meetingToken);

      expect(meeting).not.toBeNull();
      expect(meeting.organizationId).toBeFalsy();
    });

    it('should set the Zoom meeting UID in the meeting record', async () => {
      expect(meeting?.zoomMeetingId).toBe(ZoomMeetingUID);
    });

    it('should set the Zoom meeting NID in the meeting record', async () => {
      expect(meeting?.zoomNumericMeetingId).toBe(zoomMeetingNID);
    });

    afterAll(async () => {
      await prisma.meetingToken.deleteMany({where: {value: responseData?.body?.meetingToken}});
      await prisma.meeting.delete({where: {id: meeting.id}});
    });
  });
});

describe('Zoom createMeetingEndpoint locking behavior', () => {
  it('should lock a meeting for a locked user', async () => {
    const ZoomMeetingUID = uuid();
    const zoomMeetingNID = uuid();

    const response = {json: jest.fn(), cookie: (headerName: string) => response} as any;
    const next = jest.fn();

    const {accessToken, refreshToken} = await insertLockedOrganizationDomainUserAndTokens('Locked Zoom Meeting');
    const request = {
      cookies: {ZoomMeetingUID, accessToken, refreshToken},
      body: {zoomMeetingNID},
      get: (headerName: string) => undefined,
      headers: {'user-agent': ''},
    } as any;

    await createMeetingWithZoomIdentifiersEndpoint(request, response, next);

    const responseData = response.json.mock.calls[0][0];

    const meeting = await fetchMeetingByToken(responseData.body.meetingToken);

    expect(meeting).not.toBeNull();
    expect(meeting.organizationId).toBeTruthy();
  });

  it('should not lock a meeting for an unlocked user', async () => {
    const ZoomMeetingUID = uuid();
    const zoomMeetingNID = uuid();

    const response = {json: jest.fn(), cookie: (headerName: string) => response} as any;
    const next = jest.fn();

    const {accessToken, refreshToken} = await insertUnlockedOrganizationDomainUserAndTokens('Locked Zoom Meeting');
    const request = {
      cookies: {ZoomMeetingUID, accessToken, refreshToken},
      body: {zoomMeetingNID},
      get: (headerName: string) => undefined,
      headers: {'user-agent': ''},
    } as any;

    await createMeetingWithZoomIdentifiersEndpoint(request, response, next);

    const responseData = response.json.mock.calls[0][0];

    const meeting = await fetchMeetingByToken(responseData.body.meetingToken);

    expect(meeting).not.toBeNull();
    expect(meeting.organizationId).toBeFalsy();
  });
});
