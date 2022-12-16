import {Prisma} from '@prisma/client';
import {getPrismaClient} from '../prisma-client';
import {createPerson} from './create-person';
import {v4 as uuid} from 'uuid';
import {FullPersonWithEmail, UnsavedHubspotContact, UserRecord} from '../../server-core/server-types';
import {fetchOrCreateHubspotContact} from '../../hubspot-apis/hubspot-contacts';

export const createUser = async (
  newUser: Omit<UserRecord, 'id' | 'personId'>,
  googleTokens: Record<string, any> = {},
  zoomTokens: Record<string, any> | null = null,
  test_RunPostSignupAsyncProcess: boolean = true, // Able to turn off for insertTestUser
  awaitAsyncProcess: boolean = false // Able to turn on for testing of features you need Post Process to complete
): Promise<UserRecord> => {
  const prisma = getPrismaClient();
  const associatedPerson = await createPerson({
    email: newUser.loginEmail,
    displayName: newUser.displayName || '',
    picture: newUser.picture,
  });

  try {
    const createdUser = await prisma.user.create({
      data: {
        ...newUser,
        zoomTokens: zoomTokens || Prisma.DbNull,
        tokens: googleTokens,
        person: {
          connect: {
            id: associatedPerson.id,
          },
        },
        organizationId: undefined,
        organization: associatedPerson?.organizationId ? {connect: {id: associatedPerson.organizationId}} : undefined,
      },
    });

    // NOTE: This can be avoided by doing the following:
    // 1. Make our custom defined types extend the Prisma types (you can import them).
    // 2. Use Enums in Prisma and Postgres as data types.
    // 3. Once (1) and (2) are done, you can remove this code.
    const filteredForStandardFields: UserRecord = {
      id: createdUser.id,
      serviceId: createdUser.serviceId,
      displayName: createdUser.displayName,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      loginEmail: createdUser.loginEmail,
      picture: createdUser.picture,
      personId: createdUser.personId,
      zoomUserId: createdUser.zoomUserId,
      signUpService: createdUser.signUpService,
      signUpProductSurface: createdUser.signUpProductSurface,
      wipFeature: createdUser.wipFeature,
      organizationId: associatedPerson.organizationId || undefined,
    };

    // Don't run these during standard test user generation, just when specifically testing.
    if (test_RunPostSignupAsyncProcess) {
      await postSignupAsyncProcess(filteredForStandardFields, associatedPerson, awaitAsyncProcess);
    }

    return filteredForStandardFields;
  } catch (e) {
    console.log(`Could not create user with email ${newUser.loginEmail}`);
    throw e;
  }
};

const postSignupAsyncProcess = async (
  user: UserRecord,
  associatedPerson: FullPersonWithEmail,
  awaitAsyncProcess: boolean
) => {
  // For HS Sync, no Await, run async unless specifically needed for testing.

  if (awaitAsyncProcess) {
    await hubspotContactAsyncProcess(user);
  } else {
    hubspotContactAsyncProcess(user);
  }

  // TODO: Once getMeetingsFromTodayEndpoint goes to socket, we don't need to await the below but can send down new message
  // TODO: If we haven't reactivated sample meetings by, say, October 2022, think about removing them from the codebase.
  // await createSampleMeeting(user, associatedPerson);
};

const hubspotContactAsyncProcess = async (user: UserRecord) => {
  const hubspotContact: UnsavedHubspotContact = {
    email: user.loginEmail,
    firstname: user.firstName || '',
    lastname: user.lastName || '',
    userId: user.id,
    zoom_is_active: user.signUpService === 'Zoom',
    google_is_active: user.signUpService === 'Google',
  };

  const prisma = getPrismaClient();

  try {
    const hubspotId = await fetchOrCreateHubspotContact(hubspotContact);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        hubspotId,
      },
    });
  } catch (err) {
    console.error(err);
  }
};
