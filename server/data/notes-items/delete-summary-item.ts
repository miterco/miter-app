import {Note} from 'miter-common/SharedTypes';
import {noteFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';

import {fetchSummaryItem} from './fetch-summary-item';

const prisma = getPrismaClient();

export const deleteSummaryItem = async (id: string): Promise<{id: string; note: Note | null}> => {
  // Delete all references to the summary item before deleting it.
  await prisma.itemAssociatedPerson.updateMany({
    where: {summaryItemId: id},
    data: {summaryItemId: null},
  });

  // Deleting a summary item is an implicit unpin, so we should update any associated note.
  // Not using pinNote() here because that has side effects.
  const item = await fetchSummaryItem(id);

  const note = item?.noteId
    ? noteFromPrismaType(
        await prisma.note.update({
          where: {id: item.noteId},
          data: {itemType: 'None'},
        })
      )
    : null;

  await prisma.summaryItem.delete({
    where: {
      id,
    },
  });

  return {id, note};
};
