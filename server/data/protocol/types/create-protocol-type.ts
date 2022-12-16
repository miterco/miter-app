import {getPrismaClient} from '../../prisma-client';

const prisma = getPrismaClient();

interface UnsavedProtocolType {
  name: string;
  description: string;
  data?: object;
}

export const createProtocolType = async (data: UnsavedProtocolType) => {
  return await prisma.protocolType.create({ data });
};