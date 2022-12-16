import {getPrismaClient} from '../../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolPhaseIdError} from '../protocol.errors';

const prisma = getPrismaClient();

export const deleteProtocolPhaseById = async (id: string) => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolPhaseIdError);

  return await prisma.protocolPhase.delete({where: {id}});
};