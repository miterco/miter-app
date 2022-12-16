/*
 * Generalized reorderable list component. Pulled with minimal modifications from here:
 * https://codesandbox.io/s/framer-motion-2-drag-to-reorder-forked-illop?file=/src/dynamic.ts:0-3925
 *
 * TODO: Read through and understand in more detail, pare down, integrate better with the rest of
 * our code. I'm allowing myself to defer that effort on the theory that this is still less opaque
 * than the third-party module we'd have used instead.
 */

import React, {useEffect, useState} from 'react';
import {useReorderableList} from './ReorderableListUtil';
import ReorderableListItem from './ReorderableListItem';
import {swapArrayElements} from '../Utils';
import {TargetAndTransition} from 'framer-motion';

export interface ReorderableListItemData {
  id: string;
  node: React.ReactNode;
}

export interface ReorderableListProps {
  items: ReorderableListItemData[];
  onItemsReordered?: (indexBefore: number, indexAfter: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  useMountAnimation?: boolean;
  itemHoverStyle?: TargetAndTransition;
  itemActiveStyle?: TargetAndTransition;
  itemDragStyle?: TargetAndTransition;
}

const ReorderableList: React.FC<ReorderableListProps> = props => {
  const [currentItems, setCurrentItems] = useState<ReorderableListItemData[]>([]);

  useEffect(() => {
    setCurrentItems(props.items);
  }, [props.items]);

  const handlePositionUpdate = (startPos: number, endPos: number) => {
    setCurrentItems(oldItems => swapArrayElements(oldItems, startPos, endPos));
  };

  const handleReorderCompleted = (startIdx: number, endIdx: number) => {
    if (props.onItemsReordered) props.onItemsReordered(startIdx, endIdx);
  };

  const handlers = useReorderableList({
    items: currentItems,
    swapDistance: (sibling: number) => sibling,
    onPositionUpdate: handlePositionUpdate,
    onPositionChange: handleReorderCompleted,
    onDragStart: props.onDragStart,
    onDragEnd: props.onDragEnd,
  });

  return (
    <ul>
      {currentItems.map((item, i) => (
        <ReorderableListItem
          useMountAnimation={props.useMountAnimation}
          key={item.id}
          index={i}
          children={item.node}
          itemHandlers={handlers}
          hoverStyle={props.itemHoverStyle}
          dragStyle={props.itemDragStyle}
          activeStyle={props.itemActiveStyle}
        />
      ))}
    </ul>
  );
};

export default ReorderableList;
