import {isValidUuid} from 'miter-common/CommonUtil';
import {ProtocolItemAction} from 'miter-common/SharedTypes';
import {protocolItemActionFromPrismaType} from '../../data-util';
import {getPrismaClient} from '../../prisma-client';
import {InvalidProtocolIdError} from '../protocol.errors';

const prisma = getPrismaClient();

export const fetchAllProtocolItemActionsByProtocolId = async (protocolId: string): Promise<ProtocolItemAction[]> => {
  if (!isValidUuid(protocolId)) throw new Error(InvalidProtocolIdError);
  const dbResult = await prisma.protocolItemAction.findMany({where: {protocolId}});
  return dbResult.map(protocolItemActionFromPrismaType);
};

export const fetchAllProtocolItemActionsByProtocolItemId = async (
  protocolItemId: string
): Promise<ProtocolItemAction[]> => {
  const dbResult = await prisma.protocolItemAction.findMany({where: {protocolItemId}});
  return dbResult.map(protocolItemActionFromPrismaType);
};

export const fetchAllProtocolItemActionsByProtocolItemIds = async (
  protocolItemIds: string[]
): Promise<ProtocolItemAction[]> => {
  const dbResult = await prisma.protocolItemAction.findMany({where: {protocolItemId: {in: protocolItemIds}}});
  return dbResult.map(protocolItemActionFromPrismaType);
};
