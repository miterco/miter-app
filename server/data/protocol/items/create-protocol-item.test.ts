import {createProtocolItem} from './create-protocol-item';
import {PrismaClient} from '@prisma/client';
import {deleteProtocolItemById} from './delete-protocol-item';
import {insertTestProtocol} from '../../../testing/generate-test-data';
import {ProtocolItemActionType, ProtocolItemType} from 'miter-common/SharedTypes';

const prisma = new PrismaClient();

describe('createProtocolItem', () => {
  const data: any = {
    text: 'What should we focus on next quarter?',
    tags: ['group 1', 'group 2'],
    type: ProtocolItemType.Group,
  };
  let protocolItem: any;
  let testData: any;

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
    });
    data.creatorId = testData.protocol.creatorId;
    data.protocolId = testData.protocol.id;
    data.protocolPhaseId = testData.protocolPhases[0].id;
    protocolItem = await createProtocolItem(data);
  });

  afterAll(async () => {
    await deleteProtocolItemById(protocolItem.id);
    await testData.deleteTestProtocol();
  });

  it('should return the created record', async () => {
    expect(protocolItem).not.toBeNull();
    expect(protocolItem.id).not.toBeNull();
    expect(protocolItem.text).toEqual(data.text);

    for (const tag of data.tags) {
      expect(protocolItem.tags).toContain(tag);
    }
  });

  it('should save the new record to the database', async () => {
    const fetchedRecord = await prisma.protocolItem.findUnique({where: {id: protocolItem.id}});
    expect(fetchedRecord).not.toBeNull();
    expect(fetchedRecord?.id).toEqual(protocolItem.id);
    expect(fetchedRecord?.text).toEqual(data.text);

    for (const tag of data.tags) {
      expect(fetchedRecord?.tags).toContain(tag);
    }
  });
});
