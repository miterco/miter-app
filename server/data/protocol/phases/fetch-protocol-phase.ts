import {getPrismaClient} from '../../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolTypeIdError} from '../protocol.errors';

const prisma = getPrismaClient();

export const fetchFirstPhaseByProtocolType = async (protocolTypeId: string) => {
  if (!isValidUuid(protocolTypeId)) throw new Error(InvalidProtocolTypeIdError);

  const phases = await prisma.protocolPhase.findMany({where: {protocolTypeId, index: 1}});
  if (phases.length === 0) throw new Error(`No first phase found for protocol type ${protocolTypeId}`);

  return phases[0];
};
