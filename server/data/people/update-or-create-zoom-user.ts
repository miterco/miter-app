// import { getPrismaClient } from '../prisma-client';

import {createUser} from '../../data/people/create-user';
import {fetchUserByLoginEmail, fetchUserByZoomId} from '../../data/people/fetch-user';
import {setUserZoomCredentials} from '../../data/people/set-user-zoom-credentials';
import {ProductSurface, SignUpService} from '@prisma/client';
import {UserRecord} from '../../server-core/server-types';
import {configureNewAnalyticsUser} from '../../server-core/analytics';

// const prisma = getPrismaClient();

export const updateOrCreateZoomUser = async (
  zoomUser: Record<string, any>
): Promise<{user: UserRecord; isNewUser: boolean}> => {
  // TODO: Find out if the loginEmail address is unique. If so, uncomment this and delete the rest.
  // return prisma.user.upsert({
  //  where: {
  //    loginEmail: zoomUser.email,
  //  },
  //  update: {
  //    zoomUserId: zoomUser.id,
  //    zoomTokens: zoomUser.credentials,
  //  },
  //  create: {
  //    firstName: zoomUser.first_name,
  //    lastName: zoomUser.last_name,
  //    displayName: zoomUser.first_name + ' ' + zoomUser.last_name,
  //    picture: zoomUser.pic_url,
  //    loginEmail: zoomUser.email,
  //    serviceId: null,
  //    zoomUserId: zoomUser.id,
  //    zoomTokens: zoomUser.credentials,
  //  },
  // });
  const linkedUser = await fetchUserByLoginEmail(zoomUser.email);
  const existingUser = linkedUser || (await fetchUserByZoomId(zoomUser.id));

  if (existingUser) {
    await setUserZoomCredentials(existingUser.id, zoomUser.id, zoomUser.credentials);
    return {user: existingUser, isNewUser: false};
  } else {
    configureNewAnalyticsUser(zoomUser.email, ProductSurface.ZoomApp);
    return {
      user: await createUser(
        {
          firstName: zoomUser.first_name,
          lastName: zoomUser.last_name,
          displayName: `${zoomUser.first_name} ${zoomUser.last_name}`,
          picture: zoomUser.pic_url,
          loginEmail: zoomUser.email,
          serviceId: null,
          zoomUserId: zoomUser.id,
          signUpService: SignUpService.Zoom,
          signUpProductSurface: ProductSurface.ZoomApp,
        },
        {}, // Google Auth credentials.
        zoomUser.credentials
      ),
      isNewUser: true,
    };
  }
};
