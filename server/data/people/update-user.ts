import {ValidationError} from 'miter-common/SharedTypes';
import {standardUserFieldsForPrisma, UserRecord} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const updateUser = async (id: string, updates: Omit<Partial<UserRecord>, 'personId' | 'id'>) => {
  if ((updates as any).id) throw new ValidationError('updateUser received an attempted change to the ID column.');

  const validKeys = standardUserFieldsForPrisma as Record<string, boolean>;
  Object.keys(updates).forEach(key => {
    if (!validKeys[key]) throw new ValidationError(`updateUser received an attempted change to the ${key} column.`);
  });

  return await prisma.user.update({
    where: {
      id,
    },
    data: updates,
    select: standardUserFieldsForPrisma,
  });
};
