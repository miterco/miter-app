import {ProductSurface} from '@prisma/client';
import {UserSchema} from 'miter-common/schemas';
import {createMagicLink} from '../../data/magic-links/create-magic-link';
import {createUser} from '../../data/people/create-user';
import {fetchUserByLoginEmail} from '../../data/people/fetch-user';
import {sendPasswordlessSignInEmail} from '../../email/send-passwordless-sign-in-email';
import HttpError from '../../errors/HttpError';
import {configureNewAnalyticsUser} from '../../server-core/analytics';
import httpEndpoint from '../../server-core/http/http-endpoint';
import bodySchema from '../../server-core/http/middlewares/bodySchema';

/**
 * Performs passwordless sign-up.
 *
 * It only creates a new user if there's no users already using the given email address.
 */
export const passwordlessSignUpEndpoint = httpEndpoint(
  bodySchema({
    firstName: UserSchema.firstName,
    lastName: UserSchema.lastName,
    email: UserSchema.email,
  }),
  async (request, response) => {
    const {email, firstName, lastName} = request.body;
    let user = await fetchUserByLoginEmail(email);

    if (!user) {
      user = await createUser({
        loginEmail: email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        signUpService: 'Email',
        signUpProductSurface: ProductSurface.WebApp,
        serviceId: null,
        zoomUserId: null,
        picture: '',
      });
      configureNewAnalyticsUser(email, ProductSurface.WebApp);
    }

    if (!user) throw new HttpError(500, 'Something went wrong when trying to create a new user');

    const magicLink = await createMagicLink(user.id);
    sendPasswordlessSignInEmail(magicLink.token, user);

    return {message: 'Magic link created'};
  }
);
