import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const deletePersonById = async (personId: string) => {
  await prisma.$transaction([
    prisma.emailAddress.deleteMany({where: {personId}}),
    prisma.person.delete({where: {id: personId}}),
  ]);
};
