import {uuid} from 'miter-common/CommonUtil';
import {insertTestDataForLocking, insertTestOrganizationAndDomain} from '../../testing/generate-test-data';
import {mergeOrganizations} from './merge-organizations';

const existingOrganizationId = '1b4eaece-7cb3-427e-9722-f4cddc7b6fd3';

describe('mergeOrganizations', () => {
  it('should return a defined error if the supplied primaryId is not in the database', async () => {
    const primaryId = uuid();
    await expect(mergeOrganizations(primaryId, existingOrganizationId)).rejects.toThrowError(
      `Organization ${primaryId} not found`
    );
  });
  it('should return a defined error if the supplied mergingId is not in the database', async () => {
    const mergingId = uuid();
    await expect(mergeOrganizations(existingOrganizationId, mergingId)).rejects.toThrowError(
      `Organization ${mergingId} not found`
    );
  });

  it('should allow locked -> locked and unlocked -> locked but not locked -> unlocked merges', async () => {
    const {unlockedOrganization, lockedOrganization, secondLockedOrganization} = await insertTestDataForLocking();

    await expect(mergeOrganizations(unlockedOrganization.id, lockedOrganization.id)).rejects.toThrowError(
      'Attempting to merge locked organization into unlocked organzation'
    );

    const mergedUToL = mergeOrganizations(lockedOrganization.id, unlockedOrganization.id);
    expect(mergedUToL).toBeTruthy();

    const mergedLToL = mergeOrganizations(lockedOrganization.id, secondLockedOrganization.id);
    expect(mergedLToL).toBeTruthy();
  });
});
