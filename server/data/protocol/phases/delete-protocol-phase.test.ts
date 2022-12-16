import {deleteProtocolPhaseById} from './delete-protocol-phase';
import {PrismaClient} from '@prisma/client';
import {InvalidProtocolPhaseIdError} from '../protocol.errors';
import {insertTestProtocol} from '../../../testing/generate-test-data';

const prisma = new PrismaClient();

describe('deleteProtocolPhaseById', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await insertTestProtocol('deleteProtocolPhaseById', {phases: ['Phase 1'], excludeProtocol: true});
  });

  afterAll(async () => {
    await testData.deleteTestProtocol({excludePhases: true, excludeProtocol: true});
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(deleteProtocolPhaseById(invalidId)).rejects.toThrow(InvalidProtocolPhaseIdError);
    }
  });

  it('should delete the record from the database', async () => {
    const protocolPhase = testData.protocolPhases[0];
    const recordCountBeforeDelete = await prisma.protocolPhase.count({where: {id: protocolPhase.id}});
    expect(recordCountBeforeDelete).toBe(1);

    await deleteProtocolPhaseById(protocolPhase.id);

    const recordCountAfterDelete = await prisma.protocolPhase.count({where: {id: protocolPhase.id}});
    expect(recordCountAfterDelete).toBe(0);
  });
});
