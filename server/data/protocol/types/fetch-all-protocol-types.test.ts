import {fetchAllProtocolTypes} from './fetch-all-protocol-types';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

describe('fetchAllProtocolTypes', () => {
  const testData: any[] = [];

  beforeAll(async () => {
    for (let typeIdx = 1; typeIdx <= 10; typeIdx++) {
      testData.push(
        await prisma.protocolType.create({
          data: {name: `fetchAllProtocolTypes ${typeIdx}`, description: `Description #${typeIdx}`},
        })
      );
    }
  });

  afterAll(async () => {
    await prisma.protocolType.deleteMany({
      where: {
        id: {in: testData.map(type => type.id)},
      },
    });
  });

  it('should fetch all the created records', async () => {
    const fetchedRecords = await fetchAllProtocolTypes();
    const fetchedRecordIds = fetchedRecords.map(record => record.id);

    for (const {id} of testData) {
      expect(fetchedRecordIds).toContain(id);
    }
  });

  it.todo('should include the protocol phases');
});
