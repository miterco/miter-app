import {
  UnsavedNote,
  ValidationError,
  CreateNoteRequest,
  Note,
  ItemType,
  PinNoteRequest,
  UpdateNoteRequest,
  DeleteNoteRequest,
} from 'miter-common/SharedTypes';
import {track} from 'Utils';
import conn from '../SocketConnection';

export const createNote = (note: UnsavedNote) => {
  if (note.id) throw new ValidationError('Attempting to create a note that already has an ID.');
  conn.request<CreateNoteRequest>('CreateNote', {note});
};

export const pinNote = (note: Note, itemType: ItemType) => {
  const body: PinNoteRequest = {id: note.id, itemType};
  conn.request('PinNote', body);
  track('Pin Note', {'Item Type': itemType});
};

export const editNote = (updatedNote: Note) => {
  const body: UpdateNoteRequest = {
    id: updatedNote.id,
    itemText: updatedNote.itemText,
    targetDate: updatedNote.targetDate || undefined,
  };
  conn.request('UpdateNote', body);
};

export const deleteNote = (note: Note) => {
  const body: DeleteNoteRequest = {id: note.id};
  conn.request('DeleteNote', body);
};

export const requestNotes = () => {
  conn.request('FetchAllNotes');
};
