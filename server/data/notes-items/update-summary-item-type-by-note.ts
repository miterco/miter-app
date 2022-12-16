import {ItemType, SummaryItem} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';
import {fetchSummaryItemByNote} from './fetch-summary-item-by-note';

const prisma = getPrismaClient();

export const updateSummaryItemTypeByNote = async (noteId: string, itemType: ItemType): Promise<SummaryItem | null> => {
  // This is not ideal, but prisma does not currently allow .update (as opposed to .updatemany) to return 0 records, only 1 record.

  const doesSummaryItemExist = await fetchSummaryItemByNote(noteId);
  if (!doesSummaryItemExist || !doesSummaryItemExist?.noteId) return null;

  const updatedSummaryItem = await prisma.summaryItem.update({
    where: {
      id: doesSummaryItemExist.id,
    },
    data: {
      itemType,
    },
  });

  await prisma.itemAssociatedPerson.updateMany({
    where: {noteId},
    data: {summaryItemId: updatedSummaryItem.id},
  });

  return updatedSummaryItem;
};
