import {getPrismaClient} from '../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolIdError} from './protocol.errors';
import {protocolFromPrismaType} from '../data-util';

const prisma = getPrismaClient();

export const updateProtocolById = async (id: string, data: object) => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolIdError);

  const protocol = await prisma.protocol.update({
    where: {id},
    data,
    include: {
      type: {
        include: {
          phases: {
            orderBy: {index: 'asc'},
          },
        },
      },
      items: {
        include: {creator: true, actions: true},
        orderBy: {createdAt: 'asc'},
      },
      currentPhase: true,
    },
  });

  return protocolFromPrismaType(protocol);
};
