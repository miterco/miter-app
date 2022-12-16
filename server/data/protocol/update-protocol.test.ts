import {updateProtocolById} from './update-protocol';
import {PrismaClient} from '@prisma/client';
import {insertTestProtocol} from '../../testing/generate-test-data';
import {InvalidProtocolIdError} from './protocol.errors';

const prisma = new PrismaClient();

describe('updateProtocolById', () => {
  let testData: any;
  const updateData = {title: 'This is a new title'};

  beforeAll(async () => {
    testData = await insertTestProtocol('updateProtocolById', {
      phases: ['Phase 1'],
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(updateProtocolById(invalidId, updateData)).rejects.toThrow(InvalidProtocolIdError);
    }
  });

  it('should update the database record with the given data', async () => {
    await updateProtocolById(testData.protocol.id, updateData);

    const fetchedRecord = await prisma.protocol.findUnique({where: {id: testData.protocol.id}});
    expect(fetchedRecord?.id).toEqual(testData.protocol.id);
    expect(fetchedRecord?.title).toEqual(updateData.title);
  });
});
