import app from '../../server-core/http/http-server';
import supertest from 'supertest';
import * as gAuth from '../../google-apis/google-auth';
import {google} from 'googleapis';

import {getGCalEventPermutations, insertTestUser, RawGCalEvent, testName} from '../../testing/generate-test-data';
import {createAuthToken} from '../../data/auth-tokens/create-auth-token';

jest.mock('../endpoint-utils');
jest.mock('../../google-apis/google-auth');
jest.mock('googleapis');

// Mocks & shared test data
const googleErrorMessage = {
  response: {
    data: {
      error: 'not_found',
    },
  },
};

let rawGCalEvents: RawGCalEvent[];
let serviceIdUniquePrefix: string;

beforeAll(async () => {
  (gAuth.getAuthClient as jest.Mock).mockResolvedValue({});
  const gcal = await getGCalEventPermutations();
  rawGCalEvents = gcal.rawEvents;
  serviceIdUniquePrefix = gcal.idPrefix;
});

const testRequest = supertest(app);

describe('meetingTimeInfoEndpoint', () => {
  const BaseTestServiceId = 'firstInstanceOfRecurringNoMiterId';
  const BaseTestStartTime = '2020-12-14T22:25:00.000Z';

  const testHelper = async (serviceId: string) => {
    const uniqueServiceId = serviceIdUniquePrefix + serviceId;
    const user = await insertTestUser(testName());
    const {accessToken, refreshToken, tokenExpiresAt} = await createAuthToken(user.id, 'User Agent', 'SOME.USER.IP');
    const mockGoogleEvent = rawGCalEvents.find(event => event.id === uniqueServiceId);

    (google.calendar as jest.Mock).mockReturnValue({
      events: {
        get: () => {
          if (!mockGoogleEvent) return Promise.reject(googleErrorMessage);

          return {data: mockGoogleEvent};
        },
      },
    });

    const res = await testRequest
      .get(`/api/meeting-times/g_${uniqueServiceId}`)
      .send()
      .set('Cookie', [
        `accessToken=${accessToken}`,
        `refreshToken=${refreshToken}`,
        `tokenExpiresAt=${tokenExpiresAt}`,
      ]);
    const data = JSON.parse(res.text);
    expect(res.status).toBe(200);

    return data;
  };

  it('should return times for a meeting retrieved from GCal', async () => {
    const serviceId = 'firstInstanceOfRecurringNoMiterId';
    const result = await testHelper(BaseTestServiceId);
    expect(result?.body?.startTime?.toString()).toBe(BaseTestStartTime);
  });

  it('should return times for a meeting previously retrieved from GCal', async () => {
    // Yes, this is identical to the last test; the point is to do it twice.
    const serviceId = 'firstInstanceOfRecurringNoMiterId';
    const result = await testHelper(BaseTestServiceId);
    expect(result?.body?.startTime?.toString()).toBe(BaseTestStartTime);
  });

  it('should fail for a meeting not found by GCal', async () => {
    const result = await testHelper('nonexistentServiceId');
    expect(result?.error).toBeTruthy();
    expect(typeof result?.error).toBe('string');
  });
});
