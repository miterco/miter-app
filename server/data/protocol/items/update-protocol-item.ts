import {getPrismaClient} from '../../prisma-client';
import {protocolItemFromPrismaType} from '../../data-util';
import {ProtocolItem} from 'miter-common/SharedTypes';

const prisma = getPrismaClient();

interface ProtocolItemData {
  text?: string;
  tags?: string[];
  parentId?: string | null;
}

export const updateProtocolItemById = async (id: string, data: ProtocolItemData): Promise<ProtocolItem> => {
  const editedProtocolItem = await prisma.protocolItem.update({
    where: {id},
    include: {actions: true, creator: true},
    data,
  });

  return protocolItemFromPrismaType(editedProtocolItem);
};

export const updateMultipleProtocolItemsById = async (
  ids: string[],
  data: ProtocolItemData
): Promise<ProtocolItem[]> => {
  await prisma.protocolItem.updateMany({
    where: {id: {in: ids}},
    data,
  });

  const dbResult = await prisma.protocolItem.findMany({
    where: {id: {in: ids}},
    include: {actions: true, creator: true},
  });

  return dbResult.map(protocolItemFromPrismaType);
};
