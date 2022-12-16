import {fetchAllProtocolItemChildren, fetchProtocolItemsByPhaseId} from './fetch-all-protocol-items';
import {insertTestProtocol} from '../../../testing/generate-test-data';
import {createProtocolItem} from './create-protocol-item';
import {ProtocolItem, ProtocolItemType} from 'miter-common/SharedTypes';
import {updateMultipleProtocolItemsById} from './update-protocol-item';

describe('fetchAllProtocolItemChildren', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await insertTestProtocol(`fetchAllProtocolItemChildren`, {
      items: ['GroupedItem 1', 'GroupedItem 2', 'Item 1', 'Item 2'],
      phases: ['Phase 1', 'Phase 2'],
    });

    const [testGroupedItem1, testGroupedItem2] = testData.protocolItems;
    testData.groupedItems = [testGroupedItem1, testGroupedItem2];
    const protocolItemGroup = await createProtocolItem({
      text: 'Group',
      protocolId: testData.protocol.id,
      protocolPhaseId: testData.protocolPhases[0].id,
      creatorId: testData.protocol.creatorId,
      type: ProtocolItemType.Group,
    });
    testData.protocolItemGroup = protocolItemGroup;
    await updateMultipleProtocolItemsById([testGroupedItem1.id, testGroupedItem2.id], {parentId: protocolItemGroup.id});
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should not return any children for an empty group', async () => {
    const emptyProtocolItemGroup = await createProtocolItem({
      text: 'Empty Group',
      protocolId: testData.protocol.id,
      protocolPhaseId: testData.protocolPhases[0].id,
      creatorId: testData.protocol.creatorId,
      type: ProtocolItemType.Group,
    });

    const fetchedRecords = await fetchAllProtocolItemChildren(emptyProtocolItemGroup.id);
    expect(fetchedRecords).toHaveLength(0);
  });

  it('should not return any children for a non group protocol item', async () => {
    const [protocolItem] = testData.protocolItems;
    const fetchedRecords = await fetchAllProtocolItemChildren(protocolItem.id);
    expect(fetchedRecords).toHaveLength(0);
  });

  it('should fetch all children items for the given group', async () => {
    const fetchedRecords = await fetchAllProtocolItemChildren(testData.protocolItemGroup.id);
    const fetchedItemIds = fetchedRecords.map(item => item.id);
    testData.groupedItems.forEach((groupedItem: ProtocolItem) => expect(fetchedItemIds).toContain(groupedItem.id));
  });
});

describe('fetchProtocolItemsByPhaseId', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await insertTestProtocol(`fetchProtocolItemsByPhaseId`, {
      items: ['Item 1', 'Item 2'],
      phases: ['Phase 1', 'Phase 2'],
    });
  });

  afterAll(async () => {
    await testData.deleteTestProtocol();
  });

  it('should fetch as many records as there are in the database', async () => {
    const [firstPhaseProtocolItems, secondPhaseProtocolItems] = await Promise.all([
      await fetchProtocolItemsByPhaseId(testData.protocol.id, testData.protocolPhases[0].id),
      await fetchProtocolItemsByPhaseId(testData.protocol.id, testData.protocolPhases[1].id),
    ]);
    expect(firstPhaseProtocolItems).toHaveLength(testData.protocolItems.length);
    expect(secondPhaseProtocolItems).toHaveLength(0);
  });
});
