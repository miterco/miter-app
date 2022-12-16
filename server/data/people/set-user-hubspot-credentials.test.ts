import { uuid } from 'miter-common/CommonUtil';
import { setUserHubspotCredentials } from './set-user-hubpot-credentials';

const userId = '993093f1-76af-4abb-9bdd-72dfe9ba7b8f';

test('setUserHubspotCredentials', async () => {
  const testHsId = uuid();

  const updatedUser = await setUserHubspotCredentials(userId, testHsId);

  expect(updatedUser.hubspotId).toEqual(testHsId);
});