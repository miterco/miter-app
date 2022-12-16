import {SummaryItemWithContext} from 'miter-common/SharedTypes';
import {meetingFromPrismaType, personFromPrismaType} from '../data-util';
import {getPrismaClient} from '../prisma-client';
import {TaskProgressType} from '@prisma/client';

const prisma = getPrismaClient();

export const fetchTasksByPerson = async (
  personId: string,
  filterByProgressType?: TaskProgressType
): Promise<SummaryItemWithContext[]> => {
  const tasks = await prisma.summaryItem.findMany({
    where: {
      itemType: 'Task',
      itemOwnerId: personId,
      taskProgress: filterByProgressType,
      OR: [{meeting: {isTemplate: false}}, {meeting: null}],
    },
    include: {
      meeting: {
        include: {
          meetingToken: true,
        },
      },
      topic: true,
      owner: true,
    },
    orderBy: [{targetDate: 'asc'}, {createdBy: 'asc'}],
  });

  return tasks.map(dbItem => {
    const {meeting: meetingAndTokens, topic, owner: rawOwner, ...dbSummaryItem} = dbItem;
    const tokens = meetingAndTokens?.meetingToken;
    const meetingWithoutToken = meetingAndTokens ? {...meetingAndTokens, meetingToken: undefined} : null;
    const tokenValue = tokens?.length ? tokens[0].value : '';

    const result: SummaryItemWithContext = {
      summaryItem: dbSummaryItem,
      meeting: meetingWithoutToken ? {...meetingFromPrismaType(meetingWithoutToken), tokenValue} : null,
      topic,
      owner: rawOwner ? personFromPrismaType(rawOwner) : undefined,
    };

    return result;
  });
};

export const fetchTasksByPersonMeetings = async (
  personId: string,
  filterByProgressType?: TaskProgressType
): Promise<SummaryItemWithContext[]> => {
  const dbResult = await prisma.meetingPerson.findMany({
    where: {
      personId,
      meeting: {
        isTemplate: false,
      },
    },
    include: {
      meeting: {
        include: {
          summaryItem: {
            where: {
              itemType: 'Task',
              taskProgress: filterByProgressType,
            },
            include: {
              topic: true,
              owner: true,
            },
            orderBy: [{targetDate: 'asc'}, {createdBy: 'asc'}],
          },
          meetingToken: true,
        },
      },
    },
  });

  // Note that (personId, meetingId) is a unique combo, result can only have each meeting once.
  const result: SummaryItemWithContext[] = [];
  dbResult.forEach(dbRow => {
    const {meetingToken: tokens, summaryItem: items, ...meetingWithoutToken} = dbRow.meeting;
    if (!tokens.length) console.warn('While fetching tasks, found a meeting without a token value.');
    const meeting = {...meetingFromPrismaType(meetingWithoutToken), tokenValue: tokens.length ? tokens[0].value : ''};

    items.forEach(itemWithTopic => {
      const {topic, owner: rawOwner, ...task} = itemWithTopic;
      result.push({
        summaryItem: task,
        meeting,
        topic,
        owner: rawOwner ? personFromPrismaType(rawOwner) : undefined,
      });
    });
  });

  result.sort((itemWithContextA, itemWithContextB) => {
    const itemA = itemWithContextA.summaryItem;
    const itemB = itemWithContextB.summaryItem;
    if (itemA.targetDate && !itemB.targetDate) return -1;
    if (!itemA.targetDate && itemB.targetDate) return 1;
    if (itemA.targetDate && itemB.targetDate) itemB.targetDate.getTime() > itemA.targetDate.getTime() ? 1 : -1;
    // TODO: May need to expose creation date in shared type for more reliable sorting. Not sure whether the
    // orderBy clause will be enough here.

    return 1;
  });

  return result;
};
