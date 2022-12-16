import {Note, SystemMessageType, SummaryItem} from 'miter-common/SharedTypes';
import {getDateAtMidnightUTC} from '../../server-core/server-util';
import {createSummaryItem} from './create-summary-item';
import {NoteRecord} from '../../server-core/server-types';
import {parseItemOwner} from './parse-item-owner';
import {getPrismaClient} from '../prisma-client';
import {noteFromPrismaType} from '../data-util';

type UnsavedSystemMessage = {
  meetingId: string;
  topicId?: string | null;
  createdBy?: string | null;
  protocolId?: string | null;
  systemMessageType: SystemMessageType;
};

const prisma = getPrismaClient();

export const createNote = async (
  note: Omit<NoteRecord, 'id' | 'ownerId' | 'systemMessageType' | 'timestamp'>,
  timestamp?: Date
): Promise<{note: Note; summaryItem: SummaryItem | null}> => {
  const {topicId, meetingId} = note;
  const {owner, explicit: ownerExplicitlyAssigned} = await parseItemOwner(note);

  // If owner is explicitly assigned, we assume this is a task and auto-pin it.
  const itemType = ownerExplicitlyAssigned && (!note.itemType || note.itemType === 'None') ? 'Task' : note.itemType;

  const newNote = await prisma.note.create({
    data: {
      ...note,
      meetingId: undefined,
      meeting: {connect: {id: meetingId}},
      protocolId: undefined,
      protocol: note.protocolId ? {connect: {id: note.protocolId}} : undefined,
      owner: owner?.id ? {connect: {id: owner.id}} : undefined,
      topicId: undefined,
      topic: topicId ? {connect: {id: topicId}} : undefined,
      targetDate: note.targetDate ? getDateAtMidnightUTC(note.targetDate) : note.targetDate,
      itemType,
      timestamp,
      createdBy: undefined,
      creator: note.createdBy ? {connect: {id: note.createdBy}} : undefined,
    },
  });

  const summaryItem =
    itemType !== 'None'
      ? await createSummaryItem({
          ...note,
          noteId: newNote.id,
          itemOwnerId: owner?.id || null,
          itemType,
        })
      : null;

  // TODO: We have moved the call to updateAssociatedPeople from here into the createNoteEndpoint for performance
  // reasons. This is not ideal from a data integrity perspective. May move it back without await? Either way, extraction
  // means it's easier to move throughout code.

  return {note: noteFromPrismaType(newNote), summaryItem};
};

export const createSystemMessage = async (message: UnsavedSystemMessage): Promise<Note> => {
  const itemText = '';
  const itemType = 'None';

  const newNote = await prisma.note.create({
    data: {
      ...message,
      itemText,
      itemType,
    },
  });

  return noteFromPrismaType(newNote);
};
