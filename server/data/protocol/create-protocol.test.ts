import {createProtocol} from './create-protocol';
import {PrismaClient} from '@prisma/client';
import {insertTestUser} from '../../testing/generate-test-data';
import {deleteUserById} from '../people/delete-user';
import {Protocol} from 'miter-common/SharedTypes';

const prisma = new PrismaClient();

describe('createProtocol', () => {
  let returnValue: Protocol;
  let data: any;

  beforeAll(async () => {
    const user = await insertTestUser('createProtocol');
    data = {
      creatorId: user.id,
      typeId: '21cabdf2-23a0-42f0-951c-26f0cb5d6c87', // Protocol type,
      title: 'createProtocol',
    };
    returnValue = await createProtocol(data);
  });

  afterAll(async () => {
    await prisma.protocol.delete({where: {id: returnValue.id}});
    await deleteUserById(data.creatorId);
  });

  it('should return the created record', async () => {
    expect(returnValue).not.toBeNull();
    expect(returnValue.id).not.toBeNull();
    expect(returnValue.creatorId).toEqual(data.creatorId);
    expect(returnValue.currentPhaseIndex).toEqual(0);
    expect(returnValue.typeId).toEqual(data.typeId);
    expect(returnValue.title).toEqual(data.title);
  });

  it('should save the new record to the database', async () => {
    const fetchedRecord = await prisma.protocol.findUnique({where: {id: returnValue.id}});
    expect(fetchedRecord).not.toBeNull();
    expect(fetchedRecord?.id).toEqual(returnValue.id);
    expect(fetchedRecord?.creatorId).toEqual(data.creatorId);
    expect(fetchedRecord?.currentPhaseIndex).toEqual(0);
    expect(fetchedRecord?.typeId).toEqual(data.typeId);
    expect(fetchedRecord?.title).toEqual(data.title);
  });
});
