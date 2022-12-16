import {PrismaClient} from '@prisma/client';
import {insertTestProtocol} from '../../../testing/generate-test-data';
import {InvalidProtocolItemIdError} from '../protocol.errors';
import {deleteProtocolItemById} from './delete-protocol-item';

const prisma = new PrismaClient();

describe('deleteProtocolItemById', () => {
  const data: any = {
    text: 'What should we focus on next quarter?',
    tags: ['group 1', 'group 2'],
  };
  let testData: any;

  beforeAll(async () => {
    // Create test protocol.
    testData = await insertTestProtocol('fetchProtocolItemById', {
      phases: ['Phase 1', 'Phase 2'],
      items: ['Item 1'],
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol({excludeItems: true});
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(deleteProtocolItemById(invalidId)).rejects.toThrow(InvalidProtocolItemIdError);
    }
  });

  it('should delete the record from the database', async () => {
    const protocolItem = testData.protocolItems[0];
    const recordCountBeforeDelete = await prisma.protocolItem.count({where: {id: protocolItem.id}});
    expect(recordCountBeforeDelete).toBe(1);

    await deleteProtocolItemById(protocolItem.id);

    const recordCountAfterDelete = await prisma.protocolItem.count({where: {id: protocolItem.id}});
    expect(recordCountAfterDelete).toBe(0);
  });
});
