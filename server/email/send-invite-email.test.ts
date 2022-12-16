import {uuid} from 'miter-common/CommonUtil';
import {EmailRecipient} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../data/prisma-client';
import {EmailJobName} from '../server-core/server-types';
import {insertTestUser, testName} from '../testing/generate-test-data';
import {sendInviteEmail} from './send-invite-email';

const prisma = getPrismaClient();

const Recipient: EmailRecipient = {name: 'Mike-ter', email: 'email-testing@test.miter.co'};
const RedirectUrl = '/app/m/external-token';

describe('sendInviteEmail', () => {
  it('should send an email with a button containing the invite ID', async () => {
    const displayName = `Test Invite Sender ${Date.now()}`;
    const user = await insertTestUser(testName(), {displayName});
    const inviteId = uuid();

    const res = await sendInviteEmail(user, Recipient, inviteId, RedirectUrl);
    if (!res) throw new Error('Expected sendInviteEmail() to succeed and it failed.');
    const {html, text} = res;

    expect(html).toContain(inviteId);
    expect(text).toContain(inviteId);
    expect(html).toContain(displayName);
    expect(text).toContain(displayName);
    expect(html).toContain(Recipient.name);
    expect(text).toContain(Recipient.name);
    expect(html).toContain(RedirectUrl);
    expect(text).toContain(RedirectUrl);

    const jobs = await prisma.jobsEmail.findMany({where: {creatorId: user.id}});
    expect(jobs).toHaveLength(1);

    const job = jobs[0];
    expect(job.creatorId).toEqual(user.id);
    expect(job.jobRecipients).toEqual([Recipient]);
    expect(job.jobName).toEqual(EmailJobName.InviteEmail);
  });
});
