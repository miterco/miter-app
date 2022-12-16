import { getPrismaClient } from '../prisma-client';


const prisma = getPrismaClient();

// Currently only used for tests
export const fetchItemAssociatedPeople = async (summaryItemId: string) => {

  const result = await prisma.itemAssociatedPerson.findMany({
    where: {
      summaryItemId,
    },
  });

  return result;

};

export const fetchItemAssociatedPeopleByNote = async (noteId: string) => {

  const result = await prisma.itemAssociatedPerson.findMany({
    where: {
      noteId,
    },
  });

  return result;

};