import {getPrismaClient} from '../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidMeetingIdError, InvalidProtocolIdError} from './protocol.errors';
import {protocolFromPrismaType} from '../data-util';

const prisma = getPrismaClient();

export const fetchProtocolById = async (id: string) => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolIdError);

  const protocol = await prisma.protocol.findUnique({
    where: {id},
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

  return protocol ? protocolFromPrismaType(protocol) : null;
};

export const fetchProtocolsByMeetingId = async (meetingId: string) => {
  if (!isValidUuid(meetingId)) throw new Error(InvalidMeetingIdError);

  const protocols = await prisma.protocol.findMany({
    where: {
      notes: {
        some: {meetingId},
      },
    },
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

  return protocols.map(protocol => protocolFromPrismaType(protocol));
};
