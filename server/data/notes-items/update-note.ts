import {UpdateNoteRequest, Note, SummaryItem} from 'miter-common/SharedTypes';
import {getDateAtMidnightUTC} from '../../server-core/server-util';
import {parseItemOwner} from './parse-item-owner';
import {getAssociatedPeople} from './get-associated-people';
import {fetchNote} from './fetch-note';
import {updateAssociatedPeople} from './update-associated-people';
import {fetchPersonByUserId} from '../people/fetch-person';
import {getPrismaClient, PrismaError} from '../prisma-client';
import {noteFromPrismaType} from '../data-util';

const prisma = getPrismaClient();

export const updateNote = async (
  requestBody: UpdateNoteRequest
): Promise<{note: Note; summaryItem: SummaryItem | null}> => {
  const data: Partial<UpdateNoteRequest> = {
    itemText: requestBody.itemText,
    topicId: requestBody.topicId,
  };
  let ownerId;
  let owner;

  if (requestBody.targetDate) data.targetDate = getDateAtMidnightUTC(requestBody.targetDate);

  // Extract the email mentions from the item text.
  if (data.itemText) {
    const existingNote = await fetchNote(requestBody.id);
    ({owner} = await parseItemOwner({...existingNote, itemText: data.itemText}));
    ownerId = owner?.id;
  }

  const updatedNote = await prisma.note.update({
    where: {id: requestBody.id},
    data: {
      ...data,
      ownerId: owner?.id,
    },
  });

  let summaryItem: SummaryItem | null = null;
  try {
    summaryItem = await prisma.summaryItem.update({
      where: {noteId: requestBody.id},
      data: {
        ...data,
        itemOwnerId: ownerId || undefined,
      },
    });
  } catch (err: any) {
    if (err.code !== PrismaError.RecordNotFound) {
      // Anything other than RecordNotFound else we treat as a real error.
      throw err;
    }
  }

  // Update the item associated people.
  const associatedPeople = await getAssociatedPeople(updatedNote);
  const author = updatedNote.createdBy ? await fetchPersonByUserId(updatedNote.createdBy) : null;

  if (author) associatedPeople.push(author);

  await updateAssociatedPeople(updatedNote?.id, summaryItem?.id, associatedPeople);

  if (!updatedNote) throw new Error(`Note: ${requestBody.id} not found for editing`);

  return {note: noteFromPrismaType(updatedNote), summaryItem};
};
