import {fetchProtocolItemById} from './fetch-protocol-item';
import {PrismaClient} from '@prisma/client';
import {InvalidProtocolItemIdError} from '../protocol.errors';
import {insertTestProtocol} from '../../../testing/generate-test-data';

const prisma = new PrismaClient();

describe('fetchProtocolItemById', () => {
  let testData: any;

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

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(fetchProtocolItemById(invalidId)).rejects.toThrow(InvalidProtocolItemIdError);
    }
  });

  it('should fetch the corresponding record from the database', async () => {
    for (const item of testData.protocolItems) {
      const fetchedRecord = await fetchProtocolItemById(item.id);

      expect(fetchedRecord).not.toBeNull();
      expect(fetchedRecord?.id).toEqual(item.id);
      expect(fetchedRecord?.text).toEqual(item.text);
    }
  });
});
