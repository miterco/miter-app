import {getPrismaClient} from '../../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolItemIdError} from '../protocol.errors';
import {protocolItemFromPrismaType} from '../../data-util';
import {ProtocolItem} from 'miter-common/SharedTypes';

const prisma = getPrismaClient();

interface ProtocolItemData {
  isForcefullyPrioritized: boolean;
  isForcefullyDeprioritized: boolean;
}

export const prioritizeProtocolItemById = async (id: string, data: ProtocolItemData): Promise<ProtocolItem> => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolItemIdError);

  const updatedProtocolItem = await prisma.protocolItem.update({
    where: {id},
    include: {actions: true, creator: true},
    data,
  });

  return protocolItemFromPrismaType(updatedProtocolItem);
};
