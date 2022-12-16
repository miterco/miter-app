import {ProductSurface} from '@prisma/client';
import {uuid} from 'miter-common/CommonUtil';
import {insertTestUser, testName} from '../../testing/generate-test-data';
import {fetchUserByMiterId} from './fetch-user';
import {updateUser} from './update-user';

describe('updateUser', () => {
  it('should update a user with changes to some basic fields.', async () => {
    const user = await insertTestUser(testName());
    const displayName = `New Display Name ${uuid()}`;
    const loginEmail = `new-login-email-${uuid()}@example.com`;
    const signUpProductSurface = ProductSurface.ChromeExtension;
    const picture = `https://example.com/picture-${uuid()}`;
    const updatedUser = await updateUser(user.id, {displayName, loginEmail, signUpProductSurface, picture});

    expect(updatedUser.displayName).toBe(displayName);
    expect(updatedUser.loginEmail).toBe(loginEmail);
    expect(updatedUser.signUpProductSurface).toBe(signUpProductSurface);
    expect(updatedUser.picture).toBe(picture);
  });

  it('should not alter the user ID', async () => {
    const user = await insertTestUser(testName());
    const originalId = user.id;
    const originalDisplayName = user.displayName;
    const newId = uuid();
    const displayName = `Ill-Fated Display Name ${uuid()}`;
    const updatedUserPromise = updateUser(user.id, {id: newId, displayName} as any);
    await expect(updatedUserPromise).rejects.toThrow();

    const fetchedUser = await fetchUserByMiterId(originalId);
    expect(fetchedUser?.displayName).toBe(originalDisplayName);
  });

  it('should not alter fields outside standard Prisma ones', async () => {
    const user = await insertTestUser(testName());
    const originalId = user.id;
    const originalDisplayName = user.displayName;
    const displayName = `Ill-Fated Display Name ${uuid()}`;

    const updatedUserPromise = updateUser(user.id, {displayName, gcalPushChannel: 'foo'} as any);
    await expect(updatedUserPromise).rejects.toThrow();

    const fetchedUser = await fetchUserByMiterId(originalId);
    expect(fetchedUser?.displayName).toBe(originalDisplayName);
  });
});
