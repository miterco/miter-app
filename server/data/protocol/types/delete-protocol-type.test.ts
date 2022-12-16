import {deleteProtocolTypeById} from './delete-protocol-type';
import {PrismaClient, protocolType} from '@prisma/client';
import {InvalidProtocolTypeIdError} from '../protocol.errors';

const prisma = new PrismaClient();

describe('deleteProtocolTypeById', () => {
  let dbRecord: protocolType;
  const data = {
    name: 'Test protocol type',
    description: 'This protocol type is meant for testing',
  };

  beforeAll(async () => {
    dbRecord = await prisma.protocolType.create({data});
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(deleteProtocolTypeById(invalidId)).rejects.toThrow(InvalidProtocolTypeIdError);
    }
  });

  it('should delete the record from the database', async () => {
    const recordCountBeforeDelete = await prisma.protocolType.count({where: {id: dbRecord.id}});
    expect(recordCountBeforeDelete).toBe(1);

    await deleteProtocolTypeById(dbRecord.id);

    const recordCountAfterDelete = await prisma.protocolType.count({where: {id: dbRecord.id}});
    expect(recordCountAfterDelete).toBe(0);
  });
});
