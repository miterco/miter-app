import {PrismaClient, protocolItemAction} from '@prisma/client';
import {ProtocolItemAction} from 'miter-common/SharedTypes';
import {insertTestProtocol, insertTestUser} from '../../../testing/generate-test-data';
import {createMultipleProtocolItemActions, createProtocolItemAction} from './create-protocol-item-action';
import {
  deleteMultipleProtocolItemActionsById,
  deleteProtocolItemActionById,
  deleteProtocolItemActionsByProtocolItemId,
} from './delete-protocol-item-action';
import {fetchAllProtocolItemActionsByProtocolItemId} from './fetch-all-protocol-item-actions';

const prisma = new PrismaClient();

describe('deleteProtocolItemActionById', () => {
  let testData: any;
  let action: ProtocolItemAction;

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
      items: ['Item 1'],
    });
    action = await createProtocolItemAction({
      protocolId: testData.protocol.id,
      protocolItemId: testData.protocolItems[0].id,
      creatorId: testData.protocol.creatorId,
      type: 'Vote',
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should delete the record from the database', async () => {
    const recordCountBeforeDelete = await prisma.protocolItemAction.count({where: {id: action.id}});
    expect(recordCountBeforeDelete).toBe(1);

    await deleteProtocolItemActionById(action.id);

    const recordCountAfterDelete = await prisma.protocolItemAction.count({where: {id: action.id}});
    expect(recordCountAfterDelete).toBe(0);
  });
});

describe('deleteMultipleProtocolItemActionsById', () => {
  let testData: any;
  let actions: protocolItemAction[];

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
      items: ['Item 1'],
    });
    const secondCreator = await insertTestUser('deleteMultipleProtocolItemActionsById');
    await createMultipleProtocolItemActions([
      {
        protocolId: testData.protocol.id,
        protocolItemId: testData.protocolItems[0].id,
        creatorId: testData.protocol.creatorId,
        type: 'Vote',
      },
      {
        protocolId: testData.protocol.id,
        protocolItemId: testData.protocolItems[0].id,
        creatorId: secondCreator.id,
        type: 'Vote',
      },
    ]);
    actions = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should delete the record from the database', async () => {
    const recordCountBeforeDelete = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
    expect(recordCountBeforeDelete).toHaveLength(actions.length);

    await deleteMultipleProtocolItemActionsById(actions.map(({id}) => id));

    const recordCountAfterDelete = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
    expect(recordCountAfterDelete).toHaveLength(0);
  });
});

describe('deleteProtocolItemActionsByProtocolItemId', () => {
  let testData: any;
  let actions: protocolItemAction[];

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
      items: ['Item 1'],
    });
    const secondCreator = await insertTestUser('deleteMultipleProtocolItemActionsById');
    await createMultipleProtocolItemActions([
      {
        protocolId: testData.protocol.id,
        protocolItemId: testData.protocolItems[0].id,
        creatorId: testData.protocol.creatorId,
        type: 'Vote',
      },
      {
        protocolId: testData.protocol.id,
        protocolItemId: testData.protocolItems[0].id,
        creatorId: secondCreator.id,
        type: 'Vote',
      },
    ]);
    actions = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should delete the record from the database', async () => {
    const recordCountBeforeDelete = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
    expect(recordCountBeforeDelete).toHaveLength(actions.length);

    await deleteProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);

    const recordCountAfterDelete = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
    expect(recordCountAfterDelete).toHaveLength(0);
  });
});
