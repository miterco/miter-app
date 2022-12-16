import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

export const deleteProtocolItemActionById = async (protocolItemActionId: string) => {
  return await prisma.protocolItemAction.delete({where: {id: protocolItemActionId}});
};

export const deleteMultipleProtocolItemActionsById = async (protocolItemActionIds: string[]) => {
  return await prisma.protocolItemAction.deleteMany({where: {id: {in: protocolItemActionIds}}});
};

export const deleteProtocolItemActionsByProtocolItemId = async (protocolItemId: string) => {
  return await prisma.protocolItemAction.deleteMany({where: {protocolItemId}});
};
