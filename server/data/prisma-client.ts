import {PrismaClient} from '@prisma/client';

let _prismaClient: PrismaClient | null = null;

export enum PrismaError {
  RecordNotFound = 'P2025',
}

export const getPrismaClient = () => {
  if (_prismaClient === null) {
    _prismaClient = new PrismaClient();
    // { log: ['query', 'info', 'warn', 'error'], }
  }

  return _prismaClient;
};
