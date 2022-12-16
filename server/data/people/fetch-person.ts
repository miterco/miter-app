import {Prisma} from '@prisma/client';
import {getPrismaClient} from '../prisma-client';

import {FullPersonWithEmail} from '../../server-core/server-types';

type personWithEmails = Prisma.personGetPayload<{
  include: {emailAddress: true};
}> | null;

const prisma = getPrismaClient();

export const fetchPersonByEmail = async (emailAddress: string) => {
  const emailObject = await prisma.emailAddress.findUnique({
    where: {
      emailAddress,
    },
    include: {
      person: true,
    },
  });

  if (!emailObject) return null;

  const person: personWithEmails = await prisma.person.findUnique({
    where: {
      id: emailObject?.personId,
    },
    include: {
      emailAddress: true,
    },
  });

  return person;
};

export const fetchPersonById = async (id: string) => {
  const person = await prisma.person.findUnique({
    where: {
      id,
    },
  });

  return person;
};

export const fetchPersonByUserId = async (id: string): Promise<FullPersonWithEmail | null> => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      person: true,
    },
  });

  if (!user) return null;

  const emailRow = await prisma.emailAddress.findFirst({
    where: {
      personId: user.personId,
      emailAddress: user.loginEmail,
    },
  });

  if (!emailRow) {
    console.error(
      `Data integrity issue: Login Email ${user.loginEmail}  not found in Email Addresses for Person ID: ${user.personId}`
    );
    return null;
  }

  return {
    ...user.person,
    emailAddressId: emailRow.id,
    email: emailRow.emailAddress,
  };
};
