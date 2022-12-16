import {createMultipleProtocolItemActions, createProtocolItemAction} from './create-protocol-item-action';
import {PrismaClient, protocolItemAction} from '@prisma/client';
import {deleteProtocolItemActionById} from './delete-protocol-item-action';
import {insertTestProtocol, insertTestUser} from '../../../testing/generate-test-data';
import {fetchAllProtocolItemActionsByProtocolItemId} from './fetch-all-protocol-item-actions';

const prisma = new PrismaClient();

describe('createProtocolItemAction', () => {
  const data: any = {
    type: 'Vote',
  };
  let protocolItemAction: any;
  let testData: any;

  beforeAll(async () => {
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1'],
      items: ['Item 1'],
    });
    data.creatorId = testData.protocol.creatorId;
    data.protocolItemId = testData.protocolItems[0].id;
    data.protocolId = testData.protocol.id;
    protocolItemAction = await createProtocolItemAction(data);
  });

  afterAll(async () => {
    await deleteProtocolItemActionById(protocolItemAction.id);
    await testData.deleteTestProtocol();
  });

  it('should return the created record', async () => {
    expect(protocolItemAction).not.toBeNull();
    expect(protocolItemAction.id).not.toBeNull();
    expect(protocolItemAction.type).toEqual(data.type);
    expect(protocolItemAction.creatorId).toEqual(data.creatorId);
    expect(protocolItemAction.protocolId).toEqual(data.protocolId);
    expect(protocolItemAction.protocolItemId).toEqual(data.protocolItemId);
  });

  it('should save the new record to the database', async () => {
    const fetchedRecord = await prisma.protocolItemAction.findUnique({where: {id: protocolItemAction.id}});
    expect(fetchedRecord).not.toBeNull();
    expect(fetchedRecord?.id).toEqual(protocolItemAction.id);
    expect(fetchedRecord?.type).toEqual(data.type);
    expect(fetchedRecord?.creatorId).toEqual(data.creatorId);
    expect(fetchedRecord?.protocolId).toEqual(data.protocolId);
    expect(fetchedRecord?.protocolItemId).toEqual(data.protocolItemId);
  });
});

describe('createMultipleProtocolItemActions', () => {
  const data: any = [
    {
      type: 'Vote',
    },
    {
      type: 'Vote',
    },
  ];
  let protocolItemActions: protocolItemAction[];
  let testData: any;

  beforeAll(async () => {
    testData = await insertTestProtocol('createMultipleProtocolItemActions', {
      phases: ['Phase 1'],
      items: ['Item 1'],
    });
    testData.secondUser = await insertTestUser('createMultipleProtocolItemActions');
    data[0].creatorId = testData.protocol.creatorId;
    data[0].protocolItemId = testData.protocolItems[0].id;
    data[0].protocolId = testData.protocol.id;
    data[1].creatorId = testData.secondUser.id;
    data[1].protocolItemId = testData.protocolItems[0].id;
    data[1].protocolId = testData.protocol.id;
    await createMultipleProtocolItemActions(data);
    protocolItemActions = await fetchAllProtocolItemActionsByProtocolItemId(testData.protocolItems[0].id);
  });

  afterAll(async () => {
    for (const action of protocolItemActions) {
      await deleteProtocolItemActionById(action.id);
    }
    await testData.deleteTestProtocol();
  });

  it('should return the created records', async () => {
    expect(protocolItemActions[0]).not.toBeNull();
    expect(protocolItemActions[0].id).not.toBeNull();
    expect(protocolItemActions[0].type).toEqual(data[0].type);
    expect(protocolItemActions[0].creatorId).toEqual(data[0].creatorId);
    expect(protocolItemActions[0].protocolId).toEqual(data[0].protocolId);
    expect(protocolItemActions[0].protocolItemId).toEqual(data[0].protocolItemId);
  });
});
