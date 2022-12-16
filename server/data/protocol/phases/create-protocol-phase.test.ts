import {createProtocolPhase} from './create-protocol-phase';
import {PrismaClient, ProtocolPhaseType} from '@prisma/client';
import {insertTestProtocol} from '../../../testing/generate-test-data';

const prisma = new PrismaClient();

describe('createProtocolPhase', () => {
  let testData: any;
  let returnValue: any;
  const data = {
    name: 'createProtocolPhase',
    description: 'Some protocol phase description',
    type: ProtocolPhaseType.SingleResponse,
    isCollective: false,
    index: 0,
  };

  beforeAll(async () => {
    testData = await insertTestProtocol('fetchProtocolItemById', {});
    returnValue = await createProtocolPhase({
      ...data,
      protocolTypeId: testData.protocolType.id,
    });
  });

  afterAll(async () => {
    await prisma.protocolPhase.delete({where: {id: returnValue.id}});
    await testData.deleteTestProtocol();
  });

  it('should return the created record', async () => {
    expect(returnValue).not.toBeNull();
    expect(returnValue.id).not.toBeNull();
    expect(returnValue.type).toEqual(data.type);
    expect(returnValue.protocolTypeId).toEqual(testData.protocolType.id);
  });

  it('should save the new record to the database', async () => {
    const fetchedRecord = await prisma.protocolPhase.findUnique({where: {id: returnValue.id}});
    expect(fetchedRecord).not.toBeNull();
    expect(fetchedRecord?.id).toEqual(returnValue.id);
    expect(fetchedRecord?.type).toEqual(data.type);
    expect(fetchedRecord?.protocolTypeId).toEqual(testData.protocolType.id);
  });
});
