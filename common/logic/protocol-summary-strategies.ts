import {Protocol, ProtocolItem, ProtocolItemType} from '../SharedTypes';

//----------------------------------------------------------------------------------------------------------------------
//                                                 TYPE DEFINITIONS
//----------------------------------------------------------------------------------------------------------------------
export type ProtocolSummaryStrategy = (items: ProtocolItem[]) => ProtocolItem[];

export interface ProcessedProtocolItem {
  item: ProtocolItem;
  isPrioritized: boolean;
  isReprioritized?: boolean;
  isDeprioritized?: boolean; // TODO combine with above after PH
}

//----------------------------------------------------------------------------------------------------------------------
//                                               PRIORITIZATION LOGIC
//----------------------------------------------------------------------------------------------------------------------
/**
 * This function takes an array of protocol of items and it prioritizes them in order to show a summary of the resulting
 * decisions in the protocol.
 *
 * The algorithm being used is: iterate over the most voted items and select them until the selected items' votes sum up
 * to 2/3 of the total number of votes.
 *
 * Users are allowed to forcefully prioritize or deprioritize items, independently of what items the algorithm selects.
 */
export const prioritizeItems = (protocolItems?: ProtocolItem[]): ProcessedProtocolItem[] => {
  if (!protocolItems) return [];

  const sortedItems = protocolItems.sort((a, b) => {
    return (b.actions?.length || 0) - (a.actions?.length || 0);
  });

  // The reason we are using three arrays is so that we can sort the items to be as follows: first the user-prioritized
  // items, then the automatically prioritized items, and lastly the user-deprioritized ones.
  const automaticallyPrioritizedItems: ProcessedProtocolItem[] = [];
  const automaticallyDeprioritizedItems: ProcessedProtocolItem[] = [];
  const forcefullyPrioritizedItems: ProcessedProtocolItem[] = [];
  const forcefullyDeprioritizedItems: ProcessedProtocolItem[] = [];

  // Take 2/3 of the total votes, rounded up.
  const totalVotes = protocolItems.reduce((acc, item) => acc + (item.actions?.length ?? 0), 0);
  let remainingVotes = Math.ceil(totalVotes * (2 / 3));

  let lastActionCount = -1;
  let lastItemPrioritized = false;
  for (const item of sortedItems) {
    const hadRemainingVotes = remainingVotes > 0;
    remainingVotes -= item.actions?.length || 0;

    // Prioritize if there were / are votes left over, OR we're
    const shouldBePrioritized: boolean =
      remainingVotes > 0 || hadRemainingVotes || (lastItemPrioritized && lastActionCount === item.actions?.length);

    if (shouldBePrioritized && item.isForcefullyDeprioritized) {
      // Forcefully deprioritized item.
      forcefullyDeprioritizedItems.push({
        item,
        isPrioritized: false,
        isReprioritized: true,
        isDeprioritized: true,
      });
    } else if (!shouldBePrioritized && item.isForcefullyPrioritized) {
      // Forcefully prioritized item.
      forcefullyPrioritizedItems.push({
        item,
        isPrioritized: true,
        isReprioritized: true,
        isDeprioritized: false,
      });
    } else if (shouldBePrioritized) {
      // Automatically prioritized item.
      automaticallyPrioritizedItems.push({
        item,
        isPrioritized: true,
        isReprioritized: false,
        isDeprioritized: false,
      });
    } else {
      // Automatically deprioritized item.
      automaticallyDeprioritizedItems.push({
        item,
        isPrioritized: false,
        isReprioritized: false,
        isDeprioritized: false,
      });
    }

    lastActionCount = item.actions?.length || -1;
    lastItemPrioritized = shouldBePrioritized;
  }

  return [
    ...automaticallyPrioritizedItems,
    ...forcefullyPrioritizedItems,
    ...automaticallyDeprioritizedItems,
    ...forcefullyDeprioritizedItems,
  ];
};

//----------------------------------------------------------------------------------------------------------------------
//                                    PRIORITIZATION STRATEGIES BY PROTOCOL TYPE
//----------------------------------------------------------------------------------------------------------------------
export const ProtocolSummaryStrategies: Record<string, ProtocolSummaryStrategy> = {
  Default: items => items, // Include all items by default.
  Brainstorm: items => {
    // Filter items with at-least one vote or in a group with at least one vote.
    const filteredGroups: string[] = [];
    for (const item of items) {
      if (item.type === ProtocolItemType.Group && item.actions?.length) {
        filteredGroups.push(item.id);
      }
    }

    return items.filter(item => item.actions?.length || (item.parentId && filteredGroups.includes(item.parentId)));
  },
  Prioritize: items => {
    // Filter automatically-prioritized and user-prioritized items.
    const filteredItems: ProtocolItem[] = [];
    const prioritizedItems = prioritizeItems(items);

    for (const item of prioritizedItems) {
      if (item.isPrioritized) filteredItems.push(item.item);
    }

    return filteredItems;
  },
};
