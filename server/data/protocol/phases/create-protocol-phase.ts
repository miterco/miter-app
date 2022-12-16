import {ProtocolPhaseType} from '@prisma/client';
import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

// TODO: Move this to the server types file.
interface UnsavedProtocolPhase {
  name: string;
  description: string;
  type: ProtocolPhaseType;
  index: number;
  protocolTypeId: string;
  isCollective: boolean;
  data?: Record<string, any>;
}

export const createProtocolPhase = async (data: UnsavedProtocolPhase) => {
  return await prisma.protocolPhase.create({data});
};