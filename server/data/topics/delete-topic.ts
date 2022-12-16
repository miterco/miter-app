import { getPrismaClient } from '../prisma-client';

import { removeAllNotesAndSummaryItemsFromTopic, removeCurrentTopicFromMeetingByTopic } from './remove-topic';

const prisma = getPrismaClient();

// May be overkill, but adding Meeting in here for extra safety & to match Edit & Create & functions
export const deleteTopic = async (id: string) => {

  const result = await removeAllNotesAndSummaryItemsFromTopic(id);

  const result2 = await removeCurrentTopicFromMeetingByTopic(id);

  const newTopic = await prisma.topic.delete({
    where: {
      id,
    }
  });

  return true;
};

