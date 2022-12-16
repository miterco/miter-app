import {updateProtocolItemById} from './update-protocol-item';
import {PrismaClient} from '@prisma/client';
import {InvalidProtocolItemIdError} from '../protocol.errors';
import {insertTestProtocol} from '../../../testing/generate-test-data';

const prisma = new PrismaClient();

describe('updateProtocolItemById', () => {
  let testData: any;
  const updateData = {
    text: 'Updated text',
    tags: ['Tag 1'],
  };

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
      items: ['Item 1', 'Item 2'],
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should update the database record with the given data', async () => {
    for (const item of testData.protocolItems) {
      await updateProtocolItemById(item.id, updateData);

      const fetchedRecord = await prisma.protocolItem.findUnique({where: {id: item.id}});
      expect(fetchedRecord?.id).toEqual(item.id);
      expect(fetchedRecord?.text).toEqual(updateData.text);
      expect(fetchedRecord?.tags).toContain(updateData.tags[0]);
    }
  });
});
