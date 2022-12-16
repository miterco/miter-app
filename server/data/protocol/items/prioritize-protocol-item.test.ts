import {PrismaClient} from '@prisma/client';
import {InvalidProtocolItemIdError} from '../protocol.errors';
import {insertTestProtocol} from '../../../testing/generate-test-data';
import {prioritizeProtocolItemById} from './prioritize-protocol-item';

const prisma = new PrismaClient();

describe('prioritizeProtocolItemById', () => {
  let testData: any;
  const updateData = {
    isForcefullyPrioritized: true,
    isForcefullyDeprioritized: false,
  };

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('prioritizeProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
      items: ['Item 1', 'Item 2'],
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(prioritizeProtocolItemById(invalidId, updateData)).rejects.toThrow(InvalidProtocolItemIdError);
    }
  });

  it('should update the database record with the given data', async () => {
    for (const item of testData.protocolItems) {
      await prioritizeProtocolItemById(item.id, updateData);

      const fetchedRecord = await prisma.protocolItem.findUnique({where: {id: item.id}});
      expect(fetchedRecord?.id).toEqual(item.id);
      expect(fetchedRecord?.isForcefullyPrioritized).toEqual(updateData.isForcefullyPrioritized);
      expect(fetchedRecord?.isForcefullyDeprioritized).toEqual(updateData.isForcefullyDeprioritized);
    }
  });
});
