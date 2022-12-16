import {
  Filter,
  PublicObjectSearchRequest,
  SimplePublicObjectInput,
} from '@hubspot/api-client/lib/codegen/crm/companies/api';
import {setUserHubspotCredentials} from '../data/people/set-user-hubpot-credentials';
import {getPrismaClient} from '../data/prisma-client';
import {UnsavedHubspotContact} from '../server-core/server-types';
import {getHubspotClient} from './hubspot-client';

// Two useful functions that have not yet been ported from V1 to V3 of the Contacts API are:
// CreateOrUpdate and GetByEmail. So, here we are.

export const fetchOrCreateHubspotContact = async (contact: UnsavedHubspotContact): Promise<string> => {
  const hubspot = await getHubspotClient();

  const fetchApiInput: PublicObjectSearchRequest = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'email',
            operator: Filter.OperatorEnum.Eq,
            value: contact.email,
          },
        ],
      },
    ],
    sorts: [],
    properties: [],
    limit: 1,
    after: 0,
  };

  const createApiInput: SimplePublicObjectInput = {
    properties: {
      email: contact.email,
      firstname: contact.firstname,
      lastname: contact.lastname,
      miter_user_id: contact.userId,
      google_is_active: contact.google_is_active ? 'true' : 'false',
      zoom_is_active: contact.zoom_is_active ? 'true' : 'false',
    },
  };

  try {
    // Note that we would expect a contact to exist quite often in a more mature marketing
    // organization where people would usually sign up for the newsletter or download a white paper
    // before becoming a user.

    const hsFetchResponse = await hubspot.crm.contacts.searchApi.doSearch(fetchApiInput);

    if (hsFetchResponse.body.results.length > 0) return hsFetchResponse.body.results[0].id;

    const hsResponse = await hubspot.crm.contacts.basicApi.create(createApiInput);

    return hsResponse.body.id;
  } catch (err: any) {
    console.log(`fetchOrCreateHubspotContact: ${err?.response?.body?.message}`);
    throw err;
  }
};

export const connectHubspotContactToUser = async (contact: UnsavedHubspotContact) => {
  const response = await fetchOrCreateHubspotContact(contact);
  const user = await setUserHubspotCredentials(contact.userId, response);
  return user;
};

export const connectHistoricalContacts = async () => {
  const prisma = getPrismaClient();
  const userList = await prisma.user.findMany({
    where: {
      hubspotId: null,
    },
  });

  for (let i = 0; i < userList.length; i++) {
    const user = userList[i];
    const zoom_is_active = Boolean(user.zoomTokens); // Update when explicit in DB
    await connectHubspotContactToUser({
      userId: user.id,
      firstname: user.firstName || '',
      lastname: user.lastName || '',
      email: user.loginEmail,
      google_is_active: Boolean(user.isActive),
      zoom_is_active,
    });
  }
};
