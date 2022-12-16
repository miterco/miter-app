import app from '../../server-core/http/http-server';
import supertest from 'supertest';
import {v4 as uuid} from 'uuid';
import {isValidUuid} from 'miter-common/CommonUtil';
import {
  insertLockedOrganizationDomainUserAndTokens,
  insertUnlockedOrganizationDomainUserAndTokens,
} from '../../testing/generate-test-data';
import {fetchMeetingByToken} from '../../data/fetch-token';

const testRequest = supertest(app);
const title = 'Create-Meeting Test Title';

const testHelper = async (reqBody: Record<string, any>, expectedStatus: number = 200) => {
  const res = await testRequest.put('/api/meeting').send(reqBody);
  const data = JSON.parse(res.text);
  expect(res.status).toBe(expectedStatus);

  return data;
};

test('Create-meeting endpoint: title only', async () => {
  const title = 'Create-Meeting w/ Just Title';
  const result = await testHelper({title});
  expect(isValidUuid(result?.body?.tokenValue)).toBe(true);
});

test('Create-meeting endpoint: no title', async () => {
  testHelper({title: ''}, 400);
});

test('Create-meeting endpoint: all nullables null', async () => {
  const reqBody = {
    title,
    goal: null,
    startTime: null,
    endTime: null,
  };
  const result = await testHelper(reqBody);
  expect(isValidUuid(result?.body?.tokenValue)).toBe(true);
});

test('Create-meeting endpoint: should ignore supplied id', async () => {
  const id = uuid();
  const result = await testHelper({title, id});
  expect(isValidUuid(result?.body.tokenValue)).toBe(true);
});

test('Locking should not happen if no user', async () => {
  const title = 'Basic Meeting for Locking Behavior';
  const result = await testHelper({title});
  const meeting = await fetchMeetingByToken(result?.body.tokenValue);
  expect(meeting.organizationId).toBeFalsy();
});

test('Locking should not happen if not a locking id', async () => {
  const {accessToken, refreshToken} = await insertUnlockedOrganizationDomainUserAndTokens('Web createMeetingEndpoint');

  const cookieString = `accessToken=${accessToken};refreshToken=${refreshToken}`;

  const res = await testRequest.put('/api/meeting').set('Cookie', [cookieString]).send({title});
  const data = JSON.parse(res.text);
  const meeting = await fetchMeetingByToken(data?.body.tokenValue);
  expect(meeting.organizationId).toBeFalsy();
});

test('Locking should happen if a locked id', async () => {
  const {organization, accessToken, refreshToken} = await insertLockedOrganizationDomainUserAndTokens(
    'Web createMeetingEndpoint'
  );

  const cookieString = `accessToken=${accessToken};refreshToken=${refreshToken}`;

  const res = await testRequest.put('/api/meeting').set('Cookie', [cookieString]).send({title});
  const data = JSON.parse(res.text);
  console.log(data);
  const meeting = await fetchMeetingByToken(data?.body.tokenValue);
  expect(meeting.organizationId).toBe(organization.id);
});
