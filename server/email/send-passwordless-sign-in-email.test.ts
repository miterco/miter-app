import {uuid} from 'miter-common/CommonUtil';
import {getPrismaClient} from '../data/prisma-client';
import {EmailJobName} from '../server-core/server-types';
import {insertTestUser, testName} from '../testing/generate-test-data';
import {sendPasswordlessSignInEmail} from './send-passwordless-sign-in-email';

const VerifyUrlBase = `${process.env.HOST}/sign-in/pwless/verify?code=`;

const prisma = getPrismaClient();

describe('sendPasswordlessSignInEmail', () => {
  it('should send an email with a verify button', async () => {
    const code = uuid();
    const verifyUrl = VerifyUrlBase + code;
    const email = `email-testing+passwordless${uuid()}@test.miter.co`;
    const name = 'Test Passwordless User';
    const user = await insertTestUser(testName(), {displayName: name, loginEmail: email});

    const emailResult = await sendPasswordlessSignInEmail(code, user);
    if (!emailResult) throw new Error('Expected sendPasswordlessSignInEmail() to succeed and it failed.');
    const {html, text} = emailResult;

    expect(html).toContain(verifyUrl);
    expect(text).toContain(verifyUrl);

    const jobs = await prisma.jobsEmail.findMany({where: {creatorId: user.id}});
    expect(jobs).toHaveLength(1);

    const job = jobs[0];
    expect(job.jobRecipients).toEqual([{name, email}]);
    expect(job.jobName).toEqual(EmailJobName.PasswordlessSignInEmail);
  });
});
