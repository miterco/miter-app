import {isValidUuid} from 'miter-common/CommonUtil';
import {AddressBookPerson} from 'miter-common/SharedTypes';

import {FullPersonWithEmail} from '../../server-core/server-types';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchPeopleByEmailAddresses = async (emailAddresses: string[]): Promise<FullPersonWithEmail[]> => {
  const people = await prisma.person.findMany({
    where: {
      emailAddress: {
        some: {
          emailAddress: {in: emailAddresses},
        },
      },
    },
    include: {
      emailAddress: true,
    },
    orderBy: {
      displayName: 'asc',
    },
  });

  // Array unpacking exercise so that we have a single array:
  // FullPersonWithEmail[] Rather than an array Person[] with each row
  // containing a subarray EmailAddress[]

  const result: FullPersonWithEmail[] = [];

  people.forEach(personRow => {
    const {emailAddress, ...person} = personRow;
    emailAddress.forEach(emailAddressRow => {
      result.push({
        ...person,
        email: emailAddressRow.emailAddress,
        emailAddressId: emailAddressRow.id,
        domainId: emailAddressRow.domainId,
      });
    });
  });

  return result;
};

export const fetchNonUsersFromAddressBook = async (
  userId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<AddressBookPerson[]> => {
  if (!isValidUuid(userId)) throw new Error('Invalid user id');

  const inAddressBookInTimeWindow = {
    calendarEvent: {
      calendarEvent_person: {
        some: {
          person: {
            user: {
              some: {id: userId},
            },
          },
        },
      },
      startTime: {gte: fromDate || undefined, lte: toDate || undefined},
    },
  };

  const addressBookPeople = await prisma.person.findMany({
    distinct: ['id'],
    where: {
      user: {none: {}},
      calendarEvent_person: {
        some: inAddressBookInTimeWindow,
      },
    },
    include: {
      calendarEvent_person: {
        where: inAddressBookInTimeWindow,
      },
      emailAddress: {
        select: {
          emailAddress: true,
        },
      },
    },
  });

  return (addressBookPeople || []).map(person => ({
    name: person.displayName,
    email: person.emailAddress[0].emailAddress,
    picture: person.picture,
    eventCount: person.calendarEvent_person.length,
  }));
};

export const fetchNonUsersFromMeeting = async (meetingId: string): Promise<AddressBookPerson[]> => {
  if (!isValidUuid(meetingId)) throw new Error('Invalid meeting id');

  const nonUsersInMeeting = await prisma.person.findMany({
    distinct: ['id'],
    where: {
      user: {none: {}},
      calendarEvent_person: {
        some: {
          calendarEvent: {meetingId},
        },
      },
    },
    include: {
      emailAddress: {
        select: {
          emailAddress: true,
        },
      },
    },
  });

  return nonUsersInMeeting
    ? nonUsersInMeeting.map(person => ({
        name: person.displayName,
        email: person.emailAddress[0].emailAddress,
        picture: person.picture,
        eventCount: 1,
      }))
    : [];
};
