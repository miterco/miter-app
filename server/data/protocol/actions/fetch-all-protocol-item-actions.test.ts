import {insertTestProtocol, insertTestUser} from '../../../testing/generate-test-data';
import {createProtocolItemAction} from './create-protocol-item-action';
import {deleteProtocolItemActionById} from './delete-protocol-item-action';
import {ProtocolItemAction} from 'miter-common/SharedTypes';
import {fetchAllProtocolItemActionsByProtocolId} from './fetch-all-protocol-item-actions';

describe('fetchAllProtocolItemActionsByProtocolId', () => {
  let testData: any;
  const actions: ProtocolItemAction[] = [];

  beforeAll(async () => {
    testData = await insertTestProtocol(`fetchAllProtocolActionsByItemId`, {
      items: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
      phases: ['Phase 1'],
    });

    // Add a vote for each item.
    for (const item of testData.protocolItems) {
      actions.push(
        await createProtocolItemAction({
          protocolItemId: item.id,
          protocolId: testData.protocol.id,
          creatorId: testData.protocol.creatorId,
          type: 'Vote',
          data: {},
        })
      );
    }
  });

  afterAll(async () => {
    for (const action of actions) {
      await deleteProtocolItemActionById(action.id);
    }
    await testData.deleteTestProtocol();
  });

  it('should fetch as many actions as created for this protocol', async () => {
    const fetchedRecords = await fetchAllProtocolItemActionsByProtocolId(testData.protocol.id);
    expect(fetchedRecords).toHaveLength(actions.length);
  });

  it('should fetch the created actions', async () => {
    const fetchedRecords = await fetchAllProtocolItemActionsByProtocolId(testData.protocol.id);

    for (const action of actions) {
      const fetchedRecord = fetchedRecords.find(({id}) => id === action.id);

      expect(fetchedRecord).not.toBeFalsy();
      expect(fetchedRecord?.type).toEqual(action.type);
      expect(fetchedRecord?.creatorId).toEqual(action.creatorId);
      expect(fetchedRecord?.protocolId).toEqual(action.protocolId);
      expect(fetchedRecord?.protocolItemId).toEqual(action.protocolItemId);
    }
  });
});
