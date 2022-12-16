import {getPrismaClient} from '../prisma-client';

import {Attendee} from '../../server-core/server-types';
import {getEmailDomain, validateEmail} from 'miter-common/CommonUtil';

const prisma = getPrismaClient();

export const createBulkPeopleFromAttendees = async (people: Attendee[]) => {
  const result: Attendee[] = [];

  for (let i = 0; i < people.length; i++) {
    const person = people[i];

    if (person.serviceId === undefined || person.serviceId === null) {
      if (validateEmail(person.email)) {
        const upsertedPerson = await prisma.emailAddress.upsert({
          where: {
            emailAddress: person.email,
          },
          update: {
            domainName: getEmailDomain(person.email),
            person: {
              upsert: {
                create: {
                  id: person.id,
                  displayName: person.displayName ?? '',
                  organization: person.organizationId ? {connect: {id: person.organizationId}} : undefined,
                },
                update: {
                  displayName: person.displayName || undefined,
                },
              },
            },
          },
          create: {
            emailAddress: person.email,
            domainName: getEmailDomain(person.email),
            domain: person.domainId ? {connect: {id: person.domainId}} : undefined,
            person: {
              create: {
                id: person.id,
                displayName: person.displayName ?? '',
                organization: person.organizationId ? {connect: {id: person.organizationId}} : undefined,
              },
            },
          },
        });

        result.push({
          id: upsertedPerson.personId,
          serviceId: person.serviceId, // Requires some Prisma magic with types - fix later
          displayName: person.displayName, // Requires some Prisma magic with types - fix later
          email: upsertedPerson.emailAddress,
          emailAddressId: upsertedPerson.id,
          optional: person.optional,
          responseStatus: person.responseStatus,
        });
      } else {
        console.error(`Received invalid email ${person.email}.`);
      }
    } else if (validateEmail(person.email)) {
      const upsertedPerson = await prisma.emailAddress.upsert({
        where: {
          emailAddress: person.email,
        },
        update: {
          domainName: getEmailDomain(person.email),
          person: {
            connectOrCreate: {
              where: {
                serviceId: person.serviceId,
              },
              create: {
                id: person.id,
                serviceId: person.serviceId,
                displayName: person.displayName ?? '',
                organization: person.organizationId ? {connect: {id: person.organizationId}} : undefined,
              },
            },
          },
        },
        create: {
          emailAddress: person.email,
          domainName: getEmailDomain(person.email),
          domain: person.domainId ? {connect: {id: person.domainId}} : undefined,
          person: {
            connectOrCreate: {
              where: {
                serviceId: person.serviceId,
              },
              create: {
                id: person.id,
                serviceId: person.serviceId,
                displayName: person.displayName ?? '',
                organization: person.organizationId ? {connect: {id: person.organizationId}} : undefined,
              },
            },
          },
        },
      });

      result.push({
        id: upsertedPerson.personId,
        serviceId: person.serviceId, // Requires some Prisma magic with types - fix later
        displayName: person.displayName, // Requires some Prisma magic with types - fix later
        email: upsertedPerson.emailAddress,
        emailAddressId: upsertedPerson.id,
        optional: person.optional,
        responseStatus: person.responseStatus,
      });
    } else {
      console.error(`Received invalid email ${person.email}.`);
    }
  }

  return result;
};
