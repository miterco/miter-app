import { setUserIsActive } from "./set-user-is-active";

test('setIsActive', async () => {

  const id = '3ae53462-70b2-46da-a62e-27ec9b12efbf';

  const result = await setUserIsActive(id, false);
  expect(result.isActive).toBeFalsy();

  const result2 = await setUserIsActive(id, true);
  expect(result2.isActive).toBeTruthy();

});