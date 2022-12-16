import {insertTestPerson, insertTestUser, testEmailRecipientList, testName} from '../testing/generate-test-data';
import sendInvitesEndpoint from './send-invites-endpoint';
import {mockSocketServer, mockWebSocket} from '../data/test-util';
import {uuid} from 'miter-common/CommonUtil';
import {EmailRecipient, SendInvitesRequest} from 'miter-common/SharedTypes';
import * as inviteEmailModule from '../email/send-invite-email';
import {fetchPersonByEmail, fetchPersonById} from '../data/people/fetch-person';

describe('send-invites endpoint', () => {
  const emailSpy = jest.spyOn(inviteEmailModule, 'sendInviteEmail');
  let userId: string;

  beforeAll(async () => {
    userId = (await insertTestUser(testName(), {displayName: 'Invite Test User'})).id;
  });

  beforeEach(() => {
    emailSpy.mockReset();
  });

  const testCore = async (
    recipients: EmailRecipient[],
    shouldSucceed: EmailRecipient[],
    shouldFail: EmailRecipient[],
    expectedSendCount: number
  ) => {
    const server = mockSocketServer();
    const client = mockWebSocket();
    (server.getUserForClient as jest.Mock).mockReturnValueOnce({userId});

    const req: SendInvitesRequest = {recipients};
    const reqId = uuid();
    await sendInvitesEndpoint(server, client, req, reqId);

    expect(server.send).toHaveBeenCalledTimes(1);
    expect(server.send).toHaveBeenCalledWith(
      client,
      'DirectResponse',
      {succeeded: shouldSucceed, failed: shouldFail},
      reqId
    );
    expect(emailSpy).toHaveBeenCalledTimes(expectedSendCount);
  };

  it('should succeed for all recipients in our standard test list', async () => {
    await testCore(testEmailRecipientList, testEmailRecipientList, [], testEmailRecipientList.length);
  });

  it('should succeed for a preexisting user but without actually sending', async () => {
    const recipients = [...testEmailRecipientList, {name: 'First Last', email: 'test@test.miter.co'}];
    await testCore(recipients, recipients, [], testEmailRecipientList.length);
  });

  it('should fail for a malformed email', async () => {
    const badRecipient = {name: 'First Last', email: 'monkey'};
    const recipients = [...testEmailRecipientList, badRecipient];
    await testCore(recipients, testEmailRecipientList, [badRecipient], testEmailRecipientList.length);
  });

  it('should update lastInvitedDate for existing people', async () => {
    const person = await insertTestPerson(testName(), 'miter.co');
    expect(person.lastInvitedDate).toBeFalsy();
    const recipientList: EmailRecipient[] = [{name: person.displayName || ' ', email: person.email}];
    await testCore(recipientList, recipientList, [], recipientList.length);
    const updatedPerson = await fetchPersonById(person.id);
    expect(updatedPerson?.lastInvitedDate).toBeTruthy();
  });

  it('should create a person with an appropriate lastInvitedDate if one does not exist', async () => {
    const name = testName();
    const email = `${uuid()}@test.miter.co`;
    const recipientList: EmailRecipient[] = [{name, email}];
    await testCore(recipientList, recipientList, [], recipientList.length);
    const createdPerson = await fetchPersonByEmail(email);
    expect(createdPerson?.lastInvitedDate).toBeTruthy();
    expect(createdPerson?.displayName).toEqual(name);
    expect(createdPerson?.emailAddress[0].emailAddress).toEqual(email);
  });
});
