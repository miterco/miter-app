import {insertTestUser, testName} from '../testing/generate-test-data';
import {fetchOrCreateHubspotContact} from './hubspot-contacts';
import {getHubspotClient} from './hubspot-client';

test('createHubspotContact, Existing Contact', async () => {
  const contact = {
    email: 'test@test.miter.co',
    firstname: 'Wilson',
    lastname: 'Smith',
    userId: '993093f1-76af-4abb-9bdd-72dfe9ba7b8f',
    google_is_active: true,
    zoom_is_active: false,
  };

  const hubspotId = await fetchOrCreateHubspotContact(contact);

  expect(hubspotId).toBe('101');
});

test('createHubspotContact, New Contact', async () => {
  const hubspot = await getHubspotClient();
  const newUser = await insertTestUser(testName());
  const contact = {
    email: newUser.loginEmail,
    firstname: newUser.firstName || '',
    lastname: newUser.lastName || '',
    userId: newUser.id,
    google_is_active: false,
    zoom_is_active: true,
  };

  const hubspotId = await fetchOrCreateHubspotContact(contact);

  expect(hubspotId).toBeTruthy();
});
