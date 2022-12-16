import Joi from 'joi';
import socketEndpoint from '../../server-core/socket/socket-endpoint';
import {fetchMeeting} from '../../data/meetings-events/fetch-meeting';
import {createProtocol} from '../../data/protocol/create-protocol';
import {createSystemMessage} from '../../data/notes-items/create-note';
import {
  MeetingResponse,
  CreateProtocolRequest,
  UpdatedNotesResponse,
  UpdatedSummaryItemsResponse,
  ValidationError,
} from 'miter-common/SharedTypes';
import {fetchFirstPhaseByProtocolType} from '../../data/protocol/phases/fetch-protocol-phase';
import {StrProtocols} from 'miter-common/Strings';
import {createSummaryItem} from '../../data/notes-items/create-summary-item';
import {updateMeeting} from '../../data/meetings-events/update-meeting';
import {messageBodySchema} from '../../server-core/socket/middlewares/message-body-schema';

export default socketEndpoint(
  messageBodySchema({
    protocolTypeId: Joi.string().guid().required(),
    title: Joi.string().required(),
    data: Joi.object(),
  }),
  async (request, response) => {
    const {protocolTypeId, title}: any = request.body as CreateProtocolRequest;
    const meeting = await fetchMeeting(request.meetingId);
    const firstPhase = await fetchFirstPhaseByProtocolType(protocolTypeId);

    if (!meeting) throw new ValidationError('Meeting not found');
    if (meeting.currentProtocolId) throw new Error(`Meeting ${request.meetingId} already has a current protocol`);
    if (!firstPhase) throw new Error(`${StrProtocols.Protocol} type ${protocolTypeId} has no first phase`);
    if (!request.userId) throw new Error('Only authenticated users can create protocols');

    const protocol = await createProtocol({
      title,
      creatorId: request.userId,
      typeId: protocolTypeId,
    });
    if (!protocol) throw new Error('Failed to create protocol');

    // Set the created protocol as the current meeting protocol.
    const updatedMeeting = await updateMeeting({id: request.meetingId, currentProtocolId: protocol.id});
    const note = await createSystemMessage({
      meetingId: request.meetingId,
      topicId: meeting.currentTopicId,
      createdBy: request.userId,
      protocolId: protocol.id,
      systemMessageType: 'Protocol',
    });

    const summaryItem = await createSummaryItem({
      noteId: note.id,
      meetingId: request.meetingId,
      topicId: meeting.currentTopicId,
      createdBy: request.userId,
      itemType: 'Pin',
      protocolId: protocol.id,
      systemMessageType: 'Protocol',
      targetDate: null,
    });
    if (!summaryItem) throw new Error('Failed to create protocol summary item');

    response.broadcast('Protocol', {created: [protocol]});
    response.broadcast<MeetingResponse>('Meeting', {meeting: updatedMeeting});
    response.broadcast<UpdatedNotesResponse>('UpdatedNotes', {created: [note]});
    response.broadcast<UpdatedSummaryItemsResponse>('UpdatedSummaryItems', {created: [summaryItem]});
  }
);
