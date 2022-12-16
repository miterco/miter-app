import {deleteProtocolById} from './delete-protocol';
import {PrismaClient, protocol} from '@prisma/client';
import {insertTestUser} from '../../testing/generate-test-data';
import {InvalidProtocolIdError} from './protocol.errors';
import {deleteUserById} from '../people/delete-user';

const prisma = new PrismaClient();

describe('deleteProtocolById', () => {
  let dbRecord: protocol;
  let user: any;

  beforeAll(async () => {
    user = await insertTestUser('deleteProtocolById');
    dbRecord = await prisma.protocol.create({
      data: {
        creatorId: user.id,
        typeId: '21cabdf2-23a0-42f0-951c-26f0cb5d6c87', // Protocol type,
        title: 'deleteProtocolById',
      },
    });
  });

  afterAll(async () => {
    await deleteUserById(user.id);
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(deleteProtocolById(invalidId)).rejects.toThrow(InvalidProtocolIdError);
    }
  });

  it('should delete the record from the database', async () => {
    const recordCountBeforeDelete = await prisma.protocol.count({where: {id: dbRecord.id}});
    expect(recordCountBeforeDelete).toBe(1);

    await deleteProtocolById(dbRecord.id);

    const recordCountAfterDelete = await prisma.protocol.count({where: {id: dbRecord.id}});
    expect(recordCountAfterDelete).toBe(0);
  });
});
