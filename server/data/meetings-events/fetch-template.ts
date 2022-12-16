import {Template} from 'miter-common/SharedTypes';
import {templateFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const fetchTemplate = async (templateId: string): Promise<Template> => {
  const template = await prisma.meeting.findUnique({
    where: {
      id: templateId,
    },
  });

  if (!template) {
    throw new Error(`ID provided: ${templateId} does not correspond to an existing template`);
  }

  if (!template.isTemplate) throw new Error(`ID provided: ${templateId} corresponds to a meeting, not a  template`);

  return templateFromPrismaType(template);
};
