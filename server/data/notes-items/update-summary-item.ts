import {UpdateSummaryItemRequest, Note, SummaryItem} from 'miter-common/SharedTypes';
import {getDateAtMidnightUTC} from '../../server-core/server-util';
import {fetchPersonByUserId} from '../people/fetch-person';
import {getAssociatedPeople} from './get-associated-people';
import {parseItemOwner} from './parse-item-owner';
import {fetchSummaryItem} from './fetch-summary-item';
import {updateAssociatedPeople} from './update-associated-people';
import {getPrismaClient} from '../prisma-client';
import {noteFromPrismaType} from '../data-util';

const prisma = getPrismaClient();

export const updateSummaryItem = async (
  requestBody: UpdateSummaryItemRequest
): Promise<{summaryItem: SummaryItem; note: Note | null}> => {
  const data = requestBody;
  let ownerId;

  // Extract the email mentions from the item text.
  if (data.itemText) {
    const summaryItem = await fetchSummaryItem(requestBody.id);

    if (summaryItem) {
      const {createdBy, noteId, id} = summaryItem;
      const associatedPeople = await getAssociatedPeople({itemText: data.itemText});
      const {owner} = await parseItemOwner({
        itemText: data.itemText,
        createdBy: createdBy || null,
      });
      const author = createdBy ? await fetchPersonByUserId(createdBy) : null;
      ownerId = owner?.id || undefined;

      if (author) associatedPeople.push(author);

      updateAssociatedPeople(noteId || undefined, id, associatedPeople);
    }
  }

  const updatedSummaryItem = await prisma.summaryItem.update({
    where: {
      id: requestBody.id,
    },
    data: {
      ...requestBody,
      id: undefined,
      itemOwnerId: ownerId,
      targetDate: requestBody.targetDate ? getDateAtMidnightUTC(requestBody.targetDate) : requestBody.targetDate,
    },
  });

  if (updatedSummaryItem.noteId !== null) {
    const updatedNote = await prisma.note.update({
      where: {
        id: updatedSummaryItem.noteId,
      },
      data: {
        ownerId,
        itemType: requestBody.itemType,
        itemText: requestBody.itemText || undefined,
        targetDate: requestBody.targetDate,
        topicId: requestBody.topicId,
      },
    });

    return {summaryItem: updatedSummaryItem, note: noteFromPrismaType(updatedNote)};
  } else {
    return {summaryItem: updatedSummaryItem, note: null};
  }
};
