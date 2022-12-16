import {getPrismaClient} from '../prisma-client';

import * as EmailValidator from 'email-validator';
import {FullPersonWithEmail} from '../../server-core/server-types';
import {fetchDomainByName} from './fetch-domain';
import {getEmailDomain} from 'miter-common/CommonUtil';

const prisma = getPrismaClient();

export const createPerson = async (
  person: Omit<FullPersonWithEmail, 'id' | 'emailAddressId'>
): Promise<FullPersonWithEmail> => {
  if (!EmailValidator.validate(person.email)) {
    throw new Error(`Invalid Email Address: ${person.email}`);
  }

  const domainName = getEmailDomain(person.email);
  const domain = await fetchDomainByName(domainName);

  try {
    const emailObject = await prisma.emailAddress.upsert({
      where: {
        emailAddress: person.email,
      },
      update: {
        person: {
          update: {
            displayName: person.displayName || undefined,
            picture: person.picture,
          },
        },
      },
      create: {
        emailAddress: person.email,
        domainName,
        domain: domain ? {connect: {id: domain.id}} : undefined,
        person: {
          create: {
            displayName: person.displayName ?? '',
            serviceId: person.serviceId,
            picture: person.picture,
            organization: domain?.organizationId ? {connect: {id: domain.organizationId}} : undefined,
            lastInvitedDate: person.lastInvitedDate,
          },
        },
      },
      include: {
        person: true,
      },
    });

    return {
      ...emailObject.person,
      emailAddressId: emailObject.id,
      email: emailObject.emailAddress,
      domainId: emailObject.domainId,
    };
  } catch (e) {
    console.log(`Could not upsert person. Person Email: ${person.email}`);
    throw e;
  }
};
