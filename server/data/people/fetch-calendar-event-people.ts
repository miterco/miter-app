import { getPrismaClient } from '../prisma-client';

import { FullPersonWithEmail } from '../../server-core/server-types';

const prisma = getPrismaClient();

export const fetchCalendarEventPeople = async (calendarEventId: string): Promise<FullPersonWithEmail[]> => {

  const personInfo = await prisma.calendarEventPerson.findMany({
    where: {
      calendarEventId,
    },
    include: {
      person: true,
      emailAddress: true,
    },
  });

  const peopleMap = personInfo.map((personRow): FullPersonWithEmail => ({
    ...personRow.person,
    email: personRow.emailAddress.emailAddress,
    emailAddressId: personRow.personEmailId,
  }));

  return (peopleMap);

};
