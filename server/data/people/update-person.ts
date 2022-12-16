import {Person} from 'miter-common/SharedTypes';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const updatePerson = async (
  id: string,
  updates: Omit<Partial<Person>, 'id' | 'initials' | 'email' | 'userId'>
): Promise<Person> => {
  const updatedPerson = await prisma.person.update({
    where: {
      id,
    },
    data: updates,
  });

  return updatedPerson;
};
