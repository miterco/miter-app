// NOTE: We are separating this out from fetch-user to avoid any possibility of ever forwarding this to the client. This is Server only! 

import { getPrismaClient } from './prisma-client';
import { UserGoogleIdentifiers } from '../server-core/server-types';

const prisma = getPrismaClient();

export const fetchGoogleIdentifiers = async (miterId: string): Promise<UserGoogleIdentifiers | null> => {

    const user = await prisma.user.findUnique({
        where: {
            id: miterId,
        },
    });

    if (!user?.serviceId || !user?.id) {
        return null;
    } else {
        return ({
            ...user,
            tokens: user.tokens as Record<string, any> ?? null // Could do validation if we really wanted before casting
        });

    }

};

export const fetchGoogleIdentifiersByChannelId = async (channelId: string): Promise<UserGoogleIdentifiers | null> => {
    const user = await prisma.user.findUnique({
        where: {
            gcalPushChannel: channelId
        },
    });

    if (!user?.serviceId || !user?.id) {
        return null;

    } else {
        return ({
            ...user,
            tokens: user.tokens as Record<string, any> ?? null // Could do validation if we really wanted before casting
        });
    }
};
