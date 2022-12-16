import Joi from 'joi';
import {uuid, validateEmail} from 'miter-common/CommonUtil';
import {EmailRecipient, InvitesSentResponse, SendInvitesRequest} from 'miter-common/SharedTypes';
import {fetchOrCreateMeetingTokenByMeetingId} from '../data/fetch-token';
import {createPerson} from '../data/people/create-person';
import {fetchPersonByEmail} from '../data/people/fetch-person';
import {fetchUserByLoginEmail} from '../data/people/fetch-user';
import {updatePerson} from '../data/people/update-person';
import {sendInviteEmail} from '../email/send-invite-email';
import {messageBodySchema} from '../server-core/socket/middlewares/message-body-schema';
import withSocketUser from '../server-core/socket/middlewares/with-socket-user';
import socketEndpoint from '../server-core/socket/socket-endpoint';

export default socketEndpoint(
  messageBodySchema({
    // Not validating the email address here because we'd like as many of these to succeed as possible.
    // It should get validated by the send-email function.
    recipients: Joi.array().items(
      Joi.object({
        name: Joi.string().allow(''),
        email: Joi.string().required(),
      })
    ),
  }),
  withSocketUser,
  async ({body, user, meetingIdOrNull: meetingId}, _res): Promise<InvitesSentResponse> => {
    if (!user?.id) throw new Error('Only authenticated users can invite others to Miter.');
    const {recipients} = body as SendInvitesRequest;
    const succeeded: EmailRecipient[] = [];
    const failed: EmailRecipient[] = [];
    let redirect = '/app';

    if (meetingId) {
      const meetingToken = await fetchOrCreateMeetingTokenByMeetingId(meetingId);
      redirect = `/app/m/${meetingToken.value}`;
    }

    for (let i = 0; i < recipients.length; i++) {
      try {
        const recip = recipients[i];

        // This means we're dual-validating emails but I don't want to hit the DB with unvalidated user input
        if (!validateEmail(recip.email)) throw new Error('Invalid email address');

        if (!(await fetchUserByLoginEmail(recip.email))) {
          // Don't send invites to existing users
          await sendInviteEmail(user, recip, uuid(), redirect);
          const personRecord = await fetchPersonByEmail(recip.email);

          const lastInvitedDate = new Date();
          if (personRecord?.id) {
            await updatePerson(personRecord.id, {lastInvitedDate});
          } else {
            await createPerson({displayName: recip.name, email: recip.email, lastInvitedDate});
          }
        }
        // Mark this as a success whether we sent an invite or the recipient was already a user
        succeeded.push(recip);
      } catch (err) {
        failed.push(recipients[i]);
      }
    }

    return {succeeded, failed};
  }
);
