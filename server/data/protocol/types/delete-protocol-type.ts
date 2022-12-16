import {getPrismaClient} from '../../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolTypeIdError} from '../protocol.errors';

const prisma = getPrismaClient();

export const deleteProtocolTypeById = async (id: string) => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolTypeIdError);

  return await prisma.protocolType.delete({where: {id}});
};