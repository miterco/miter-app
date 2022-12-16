import {Note} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchNote = async (id: string): Promise<Note> => {
  const note = await prisma.note.findUnique({
    where: {id},
  });

  if (!note) throw new Error(`Note note found for ID: ${id}`);

  const {meetingId, ...returnVal} = note;
  return returnVal;
};
