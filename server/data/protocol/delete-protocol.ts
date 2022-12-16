import {getPrismaClient} from '../prisma-client';
import {validate as isValidUuid} from 'uuid';
import {InvalidProtocolIdError} from './protocol.errors';

const prisma = getPrismaClient();

export const deleteProtocolById = async (id: string) => {
  if (!isValidUuid(id)) throw new Error(InvalidProtocolIdError);

  if (id) {
    await prisma.itemAssociatedPerson.deleteMany({
      where: {OR: [{note: {protocolId: id}}, {summaryItem: {protocolId: id}}]},
    });
    await prisma.note.deleteMany({where: {protocolId: id}});
    await prisma.summaryItem.deleteMany({where: {protocolId: id}});
    await prisma.protocolItemAction.deleteMany({where: {protocolId: id}});
    await prisma.protocolItem.deleteMany({where: {protocolId: id}});
    await prisma.protocol.delete({where: {id}});
  }
};
