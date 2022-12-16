import {uuid} from 'miter-common/CommonUtil';
import {insertTestPerson} from '../../testing/generate-test-data';
import {updatePerson} from './update-person';

describe('updatePerson', () => {
  it('should update a person with changes to some basic fields.', async () => {
    const person = await insertTestPerson('updatePerson', 'miter.co');
    expect(person.lastInvitedDate).toBeFalsy();
    const lastInvitedDate = new Date();
    const displayName = `New Display Name ${uuid()}`;
    const picture = `https://example.com/picture-${uuid()}`;

    const updatedPerson = await updatePerson(person.id, {lastInvitedDate, displayName, picture});
    expect(updatedPerson.lastInvitedDate).toEqual(lastInvitedDate);
    expect(updatedPerson.displayName).toEqual(displayName);
    expect(updatedPerson.picture).toEqual(picture);
  });
});
