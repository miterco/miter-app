import {Endpoint} from '../../server-core/socket-server';
import {UpdatedNotesResponse, DeleteNoteRequest} from 'miter-common/SharedTypes';
import {validateSocketRequestBody} from '../endpoint-utils';
import {ValidationError} from 'miter-common/SharedTypes';
import {validate as validateUuid} from 'uuid';
import {deleteNote} from '../../data/notes-items/delete-note';

const validateDeleteNoteRequest = (body: any): DeleteNoteRequest => {
  const validBody = validateSocketRequestBody(body);
  if (!(typeof validBody.id === 'string' && validateUuid(validBody.id))) {
    throw new ValidationError(`Delete-note request received an invalid note ID: ${validBody.id}`);
  }

  return validBody;
};

export const deleteNoteEndpoint: Endpoint = async (server, client, body) => {
  const meetingId = server.getExistingChannel(client);
  const {id} = validateDeleteNoteRequest(body);
  await deleteNote(id); // TODO maybe deleteNote() should have success/return value
  const res: UpdatedNotesResponse = {deleted: [{id}]};
  server.broadcast(meetingId, 'UpdatedNotes', res);

  // NOTE: The only change note-deletion makes to an associated summary item is to "orphan" it, nulling out its noteId.
  // Since that's not information we expect the client to use, we don't broadcast any summary-item change.
};
