import {PinNoteRequest, Note, SummaryItem} from 'miter-common/SharedTypes';
import {updateSummaryItemTypeByNote} from './update-summary-item-type-by-note';
import {createSummaryItem} from './create-summary-item';
import {getPrismaClient} from '../prisma-client';
import {note} from '@prisma/client';

const prisma = getPrismaClient();

const updateSummaryItem = async (note: note) => {
  const existingSummaryItem = await updateSummaryItemTypeByNote(note.id, note.itemType);
  if (existingSummaryItem) return {summaryItem: existingSummaryItem, alreadyExisted: true};

  const newSummmaryItem = await createSummaryItem({
    noteId: note.id,
    meetingId: note.meetingId,
    topicId: note.topicId,
    createdBy: note.createdBy,
    itemOwnerId: note.ownerId,
    itemText: note.itemText,
    itemType: note.itemType,
    targetDate: note.targetDate,
  });
  return {summaryItem: newSummmaryItem, alreadyExisted: false};
};

export const pinNote = async (
  requestBody: PinNoteRequest
): Promise<{note: Note; summaryItem: SummaryItem; summaryItemAlreadyExisted: boolean}> => {
  const updatedNote = await prisma.note.update({
    where: {
      id: requestBody.id,
    },
    data: {
      itemType: requestBody.itemType,
    },
  });

  const {meetingId, ...returnNote} = updatedNote;
  const {summaryItem, alreadyExisted} = await updateSummaryItem(updatedNote);
  return {note: returnNote, summaryItem, summaryItemAlreadyExisted: alreadyExisted};
};
