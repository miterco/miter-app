import {isValidUuid} from 'miter-common/CommonUtil';
import {Note} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';
import {deleteNote} from './delete-note';

const prisma = getPrismaClient();

export const deleteNoteByProtocolId = async (protocolId: string): Promise<Note> => {
  if (!isValidUuid(protocolId)) throw new Error('Invalid protocol id');
  const note = await prisma.note.findFirst({
    where: {protocolId},
  });

  if (!note) throw new Error(`Note not found for protocol ID: ${protocolId}`);

  await deleteNote(note.id);
  const {meetingId, ...returnVal} = note;
  return returnVal;
};
