import {protocolFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

// TODO: Move this to the server types file.
interface UnsavedProtocol {
  title: string;
  creatorId: string;
  typeId: string;
  data?: Record<string, any>;
}

export const createProtocol = async (data: UnsavedProtocol) => {
  const protocol = await prisma.protocol.create({
    data,
    include: {
      type: {
        include: {phases: true},
      },
      currentPhase: true,
    },
  });
 
  return protocolFromPrismaType({...protocol, items: []});
};
