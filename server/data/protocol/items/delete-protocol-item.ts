import {getPrismaClient} from '../../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolItemIdError} from '../protocol.errors';

const prisma = getPrismaClient();

export const deleteProtocolItemById = async (id: string) => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolItemIdError);

  return await prisma.protocolItem.delete({where: {id}});
};
