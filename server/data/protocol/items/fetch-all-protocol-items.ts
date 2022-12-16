import {ProtocolItem, ProtocolItemType} from 'miter-common/SharedTypes';
import {protocolItemFromPrismaType} from '../../data-util';
import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

export const fetchAllProtocolItemChildren = async (protocolItemId: string): Promise<ProtocolItem[]> => {
  const protocolItems = await prisma.protocolItem.findMany({
    where: {parentId: protocolItemId},
    include: {actions: true, creator: true},
  });
  return protocolItems.map(protocolItemFromPrismaType);
};

export const fetchProtocolItemsByPhaseId = async (
  protocolId: string,
  protocolPhaseId: string
): Promise<ProtocolItem[]> => {
  const protocolItems = await prisma.protocolItem.findMany({
    where: {protocolId, protocolPhaseId, type: ProtocolItemType.Item},
    include: {actions: true, creator: true},
  });
  return protocolItems.map(protocolItemFromPrismaType);
};
