import {Request} from 'express';
import {uuid} from 'miter-common/CommonUtil';
import {acceptInviteEndpoint} from './accept-invite-endpoint';

const NextUrl = 'example.com';

describe('acceptInviteEndpoint', () => {
  it('should redirect to the appropriate URL', () => {
    const req = {params: {inviteId: uuid()}, query: {next: NextUrl}} as unknown as Request;
    const res = {redirect: jest.fn()} as any;

    acceptInviteEndpoint(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(`${NextUrl}?showSignIn=true`);
  });
});
