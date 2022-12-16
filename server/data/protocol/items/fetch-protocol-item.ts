import {getPrismaClient} from '../../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolItemIdError} from '../protocol.errors';
import {protocolItemFromPrismaType} from '../../data-util';
import {ProtocolItem} from 'miter-common/SharedTypes';

const prisma = getPrismaClient();

export const fetchProtocolItemById = async (id: string): Promise<ProtocolItem | null> => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolItemIdError);
  const dbResult = await prisma.protocolItem.findUnique({where: {id}, include: {actions: true, creator: true}});
  return dbResult ? protocolItemFromPrismaType(dbResult) : null;
};
