import {SummaryItem, SystemMessageType} from 'miter-common/SharedTypes';
import {getDateAtMidnightUTC} from '../../server-core/server-util';
import {SummaryItemRecord} from '../../server-core/server-types';
import {getAssociatedPeople} from './get-associated-people';
import {updateAssociatedPeople} from './update-associated-people';
import {fetchPersonByUserId} from '../people/fetch-person';
import {parseItemOwner} from './parse-item-owner';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const createSummaryItem = async (item: Omit<SummaryItemRecord, 'id' | 'timestamp'>): Promise<SummaryItem> => {
  const targetDate = item.targetDate ? getDateAtMidnightUTC(item.targetDate) : null;
  const timestamp = new Date();
  const {owner} = await parseItemOwner({createdBy: item.createdBy, itemText: item.itemText || ' '}); // TODO: Require itemText on SummaryItem

  const summaryItem = await prisma.summaryItem.create({
    data: {
      noteId: item.noteId,
      meeting: item.meetingId ? {connect: {id: item.meetingId}} : undefined,
      topicId: undefined,
      topic: item?.topicId ? {connect: {id: item.topicId}} : undefined,
      itemOwnerId: undefined,
      owner: owner ? {connect: {id: owner.id}} : undefined,
      createdBy: undefined,
      creator: item.createdBy ? {connect: {id: item.createdBy}} : undefined,
      itemText: item.itemText,
      itemText2: item.itemText2,
      itemType: item.itemType || undefined,
      taskProgress: item.taskProgress,
      targetDate,
      timestamp,
      systemMessageType: (item.systemMessageType as SystemMessageType) ?? 'StandardNote',
      protocolId: undefined,
      protocol: item.protocolId ? {connect: {id: item.protocolId}} : undefined,
    },
  });

  if (item.itemText) {
    const author = summaryItem.createdBy ? await fetchPersonByUserId(summaryItem.createdBy) : null;
    const associatedPeople = await getAssociatedPeople({itemText: item.itemText});

    if (author) associatedPeople.push(author);

    updateAssociatedPeople(item.noteId || undefined, summaryItem.id, associatedPeople);
  }

  return summaryItem;
};
