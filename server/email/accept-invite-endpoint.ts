import {isValidUuid} from 'miter-common/CommonUtil';
import {trackAnalyticsEvent} from '../server-core/analytics';
import httpEndpoint from '../server-core/http/http-endpoint';

export const acceptInviteEndpoint = httpEndpoint((req, res) => {
  const {inviteId} = req.params;
  const {next} = req.query;

  // This doesn't tell us much yet -- later we can augment by keeping track of invites
  if (isValidUuid(inviteId)) trackAnalyticsEvent('Accept Invite', null, {'Invite ID': inviteId});
  else console.warn("acceptInviteEndpoint received an invite ID that's not a UUID");

  return res.redirect(next + '?showSignIn=true');
});
