import {UserRecord, standardUserFieldsForPrisma} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchUserByMiterId = async (miterId: string): Promise<UserRecord | null> => {
  if (!miterId) return null;
  const user = await prisma.user.findUnique({
    where: {
      id: miterId,
    },
    select: standardUserFieldsForPrisma,
  });

  return user;
};

export const fetchUserByGoogleId = async (googleId: string): Promise<UserRecord | null> => {
  if (!googleId) return null;
  const user = await prisma.user.findUnique({
    where: {
      serviceId: googleId,
    },
    select: standardUserFieldsForPrisma,
  });

  return user;
};

export const fetchUserByZoomId = async (zoomUserId: string): Promise<UserRecord | null> => {
  if (!zoomUserId) return null;

  const user = await prisma.user.findUnique({
    where: {zoomUserId},
    select: standardUserFieldsForPrisma,
  });

  return user;
};

export const fetchUserByPushChannel = async (channelId: string): Promise<UserRecord | null> => {
  if (!channelId) return null;
  const user = await prisma.user.findFirst({
    where: {
      gcalPushChannel: channelId,
    },
    select: standardUserFieldsForPrisma,
  });

  return user;
};

export const fetchUserByLoginEmail = async (loginEmail: string): Promise<UserRecord | null> => {
  if (!loginEmail) return null;
  const user = await prisma.user.findFirst({
    where: {
      loginEmail,
    },
    select: standardUserFieldsForPrisma,
  });

  return user;
};
