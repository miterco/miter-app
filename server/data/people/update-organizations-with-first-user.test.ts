import {
  insertTestDataForLocking,
  insertTestOrganizationAndDomain,
  insertTestUser,
  testName,
} from '../../testing/generate-test-data';
import {fetchOrganizationById} from './fetch-organization';
import {updateOrganizationsWithFirstUser} from './update-organizations-with-first-user';

describe('updateOrganizationsWithFirstUser', () => {
  it('should update with a first user all organizations without a calculated first user', async () => {
    const {
      lockedOrganization,
      unlockedOrganization,
      lockedUser: soloUser,
      unlockedUser: firstSignedUpUser,
    } = await insertTestDataForLocking();
    // Make sure we have an org with 2 users
    const _laterSignedUpUser = await insertTestUser(testName(), {organizationId: unlockedOrganization.id});

    const organizationsList = await updateOrganizationsWithFirstUser();

    const updatedOrganizationsIds = organizationsList.map(row => row.id);
    expect(updatedOrganizationsIds.includes(lockedOrganization.id)).toBeTruthy();
    expect(updatedOrganizationsIds.includes(unlockedOrganization.id)).toBeTruthy();

    const updatedLockedOrganization = organizationsList.filter(row => row.id === lockedOrganization.id)[0];
    expect(updatedLockedOrganization.firstSignedUpUserId).toBe(soloUser.id);

    const updatedUnlockedOrganization = organizationsList.filter(row => row.id === unlockedOrganization.id)[0];
    expect(updatedUnlockedOrganization.firstSignedUpUserId).toBe(firstSignedUpUser.id);
  });

  it('should not update organizations with no users', async () => {
    const {organization} = await insertTestOrganizationAndDomain(testName());

    const organizationsList = await updateOrganizationsWithFirstUser();
    const updatedOrganizationsIds = organizationsList.map(row => row.id);

    expect(updatedOrganizationsIds.includes(organization.id)).toBeFalsy();

    const notUpdatedOrganization = await fetchOrganizationById(organization.id);
    expect(organization).toEqual(notUpdatedOrganization);
  });
});
