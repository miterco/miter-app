import {SystemMessageType} from '@prisma/client';
import {Note} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchAllNotes = async (meetingId: string, omitSystemMessages?: boolean): Promise<Note[]> => {
  const result = await prisma.note.findMany({
    where: {
      meetingId,
      systemMessageType: omitSystemMessages ? SystemMessageType.StandardNote : undefined,
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  const notes: Note[] = result.map(fullNote => ({...fullNote, meetingId: undefined}));

  return notes;
};

/**
 * Gets the list of items IDs to which the given person is associated.
 *
 * @returns an object containing a `summaryItemIds` and a `noteIds` list.
 */
export const fetchItemIdsByPerson = async (personId: string) => {
  const itemAssociatedPeople = await prisma.itemAssociatedPerson.findMany({where: {personId}});

  return itemAssociatedPeople.reduce(
    (result, {noteId, summaryItemId}) => {
      if (noteId) result.noteIds.push(noteId);
      if (summaryItemId) result.summaryItemIds.push(summaryItemId);
      return result;
    },
    {summaryItemIds: [], noteIds: []} as {summaryItemIds: string[]; noteIds: string[]} // Prevents TS infering never[].
  );
};
