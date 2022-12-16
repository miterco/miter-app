import {UnsavedProtocolItemAction} from '../../../server-core/server-types';
import {protocolItemActionFromPrismaType} from '../../data-util';
import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

export const createProtocolItemAction = async (data: UnsavedProtocolItemAction) => {
  const protocolItemAction = await prisma.protocolItemAction.create({data});
  return protocolItemActionFromPrismaType(protocolItemAction);
};

export const createMultipleProtocolItemActions = async (data: UnsavedProtocolItemAction[]) => {
  return await prisma.protocolItemAction.createMany({data});
};
