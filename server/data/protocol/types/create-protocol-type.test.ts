import {createProtocolType} from './create-protocol-type';
import {PrismaClient, protocolType} from '@prisma/client';

const prisma = new PrismaClient();

describe('createProtocolType', () => {
  let returnValue: protocolType;
  const data = {
    name: 'Test protocol type',
    description: 'This protocol type is meant for testing',
  };

  beforeAll(async () => {
    returnValue = await createProtocolType(data);
  });

  it('should return the created record', async () => {
    expect(returnValue).not.toBeNull();
    expect(returnValue.id).not.toBeNull();
    expect(returnValue.name).toEqual(data.name);
    expect(returnValue.description).toEqual(data.description);
  });

  it('should save the new record to the database', async () => {
    const fetchedRecord = await prisma.protocolType.findUnique({where: {id: returnValue.id}});
    expect(fetchedRecord).not.toBeNull();
    expect(fetchedRecord?.id).toEqual(returnValue.id);
    expect(fetchedRecord?.name).toEqual(returnValue.name);
    expect(fetchedRecord?.description).toEqual(returnValue.description);
  });

  afterAll(async () => {
    await prisma.protocolType.delete({where: {id: returnValue.id}});
  });
});
