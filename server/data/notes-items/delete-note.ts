import { getPrismaClient } from '../prisma-client';

import { fetchSummaryItemByNote } from './fetch-summary-item-by-note';

const prisma = getPrismaClient();

export const deleteNote = async (id: string) => {
  const summaryItemToOrphan = await fetchSummaryItemByNote(id);

  if (summaryItemToOrphan?.id !== undefined) {

    await prisma.summaryItem.update({
      where: {
        id: summaryItemToOrphan.id,
      },
      data: {
        noteId: null,
      },
    });

  }

  // Delete all references to the note before deleting the note.
  await prisma.itemAssociatedPerson.updateMany({
    where: { noteId: id },
    data: { noteId: null },
  })

  await prisma.note.delete({
    where: { id }
  });

};
