import app from '../../server-core/http/http-server';
import supertest from 'supertest';
import * as gAuth from '../../google-apis/google-auth';
import {google} from 'googleapis';

import {insertTestMeeting, insertTestUser, testName} from '../../testing/generate-test-data';
import {fetchMeetingsInWindow} from '../../data/meetings-events/fetch-meetings-in-window';
import {MeetingWithContentFlags} from '../../server-core/server-types';
import {createAuthToken} from '../../data/auth-tokens/create-auth-token';

jest.mock('../endpoint-utils');
jest.mock('../../google-apis/google-auth');
jest.mock('googleapis');
jest.mock('../../data/meetings-events/fetch-meetings-in-window');

// Mocks & shared test data

beforeAll(() => {
  (gAuth.getAuthClient as jest.Mock).mockResolvedValue({});
});

const testRequest = supertest(app);

const testHelper = async (expectedStatus: number = 200) => {
  const meeting = await insertTestMeeting(testName());
  const user = await insertTestUser(testName());
  const {accessToken, refreshToken, tokenExpiresAt} = await createAuthToken(user.id, 'User Agent', 'SOME.USER.IP');
  const returnValue: MeetingWithContentFlags[] = [{meeting}];
  (fetchMeetingsInWindow as jest.Mock).mockReturnValue(returnValue);

  (google.calendar as jest.Mock).mockReturnValue({
    events: {
      list: () => {
        return {data: []};
      },
    },
  });

  const res = await testRequest
    .get('/api/meetings-from-today')
    .send()
    .set('Cookie', [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`, `tokenExpiresAt=${tokenExpiresAt}`]);
  const data = JSON.parse(res.text);
  expect(res.status).toBe(expectedStatus);

  return data;
};

test('getMeetingsFromTodayEndpoint', async () => {
  const result = await testHelper();
  expect(result?.body?.meetings).toHaveLength(1);
});