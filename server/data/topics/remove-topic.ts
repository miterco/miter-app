import {getPrismaClient} from '../prisma-client';

const prisma = getPrismaClient();

export const removeAllNotesAndSummaryItemsFromTopic = async (topicId: string) => {
  await prisma.topic.update({
    where: {
      id: topicId,
    },
    data: {
      note: {
        set: [],
      },
      summaryItem: {
        set: [],
      },
    },
  });

  return true;
};

export const removeCurrentTopicFromMeetingByTopic = async (topicId: string) => {
  // UpdateMany as there isn't guaranteed to be 1 found
  await prisma.meeting.updateMany({
    where: {
      currentTopicId: topicId,
    },
    data: {
      currentTopicId: null,
    },
  });

  return true;
};
