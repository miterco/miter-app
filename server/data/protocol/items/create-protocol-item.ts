import {ProtocolItem} from 'miter-common/SharedTypes';
import {UnsavedProtocolItem, UnsavedProtocolItemGroup} from '../../../server-core/server-types';
import {protocolItemFromPrismaType} from '../../data-util';
import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

export const createProtocolItem = async (
  data: UnsavedProtocolItem | UnsavedProtocolItemGroup
): Promise<ProtocolItem> => {
  const protocolItem = await prisma.protocolItem.create({
    data: {
      ...data,
      tags: data.tags || [],
    },
    include: {
      creator: true,
    },
  });

  return protocolItemFromPrismaType({...protocolItem, actions: []});
};
