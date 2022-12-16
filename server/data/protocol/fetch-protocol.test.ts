import {fetchProtocolById} from './fetch-protocol';
import {insertTestProtocol} from '../../testing/generate-test-data';
import {InvalidProtocolIdError} from './protocol.errors';

describe('fetchProtocolById', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await insertTestProtocol('fetchProtocolById', {
      phases: ['Phase 1', 'Phase 2'],
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should throw if no ID is provided', async () => {
    const invalidIds = ['', 'invalid id'];

    for (const invalidId of invalidIds) {
      await expect(fetchProtocolById(invalidId)).rejects.toThrow(InvalidProtocolIdError);
    }
  });

  it('should fetch the corresponding record from the database', async () => {
    const fetchedRecord = await fetchProtocolById(testData.protocol.id);

    expect(fetchedRecord).not.toBeNull();
    expect(fetchedRecord?.id).toEqual(testData.protocol.id);
    expect(fetchedRecord?.title).toEqual(testData.protocol.title);
  });
});
