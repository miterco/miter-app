import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import {ProtocolItem} from 'miter-common/SharedTypes';
import {FC, useCallback, useMemo} from 'react';
import {deleteProtocolItem, updateMultipleProtocolItemsGroup, updateProtocolItemGroup} from 'model/ProtocolApi';
import classNames from 'classnames';
import {useDrag, useDragLayer, useDrop} from 'react-dnd';
import {useMiterContext} from 'model/MiterContextProvider';

export type ProtocolItemGroupWithItems = {items: ProtocolItem[]; protocolItemGroup?: ProtocolItem};

export type DraggedItem = {
  item: ProtocolItem;
  group: ProtocolItemGroupWithItems;
};

interface DraggableProtocolItemProps {
  item: ProtocolItem;
  group?: ProtocolItemGroupWithItems;
  onVote: (protocolItem: ProtocolItem) => void;
  hideVoteCount: boolean;
  groupVotesCount: number;
  isGroupVotedByCurrentUser: boolean;
  isGrouped: boolean;
  onCreateGroup?: (itemsToGroup: ProtocolItem[]) => void;
}

const DraggableProtocolItem: FC<DraggableProtocolItemProps> = ({
  item,
  group,
  onVote,
  hideVoteCount,
  groupVotesCount,
  isGroupVotedByCurrentUser,
  isGrouped,
  onCreateGroup,
}) => {
  const [, drag, preview] = useDrag(() => ({
    type: 'protocol-item',
    item: {
      item,
      group,
    },
  }));

  const [{isOverCurrent, canDrop}, drop] = useDrop(
    () => ({
      accept: 'protocol-item',
      drop({item: droppedItem}: DraggedItem) {
        if (item.id !== droppedItem.id && onCreateGroup) {
          onCreateGroup([item, droppedItem]);
        }
      },
      collect: monitor => {
        const draggedItem = monitor.getItem();
        const isDraggedItemGrouped = draggedItem?.item.parentId;
        return {
          isOverCurrent: !isDraggedItemGrouped && monitor.isOver({shallow: true}),
          canDrop: !isGrouped && draggedItem?.item.id !== item.id && !draggedItem?.item.parentId,
        };
      },
    }),
    []
  );

  return (
    <div ref={preview} className={classNames('GroupItem', {isOverCurrent: canDrop && isOverCurrent})}>
      <ProtocolCard
        cardClassName={classNames({Reprioritized: isGroupVotedByCurrentUser})}
        text={item.text}
        onVote={() => onVote(item)}
        mode={ProtocolCardMode.Vote}
        isChecked={groupVotesCount > 0}
        votes={groupVotesCount}
        dragRef={drag}
        hideVoteCount={hideVoteCount}
        dropRef={canDrop ? drop : null}
      />
    </div>
  );
};

interface ProtocolItemGroupProps {
  protocolItemGroupWithItems: ProtocolItemGroupWithItems;
  onVote: (item: ProtocolItem) => void;
  onEditGroup?: (group: ProtocolItem) => void;
  onCreateGroup?: (itemsToGroup: ProtocolItem[]) => void;
}

const ProtocolItemGroup: FC<ProtocolItemGroupProps> = ({
  protocolItemGroupWithItems,
  onVote,
  onEditGroup,
  onCreateGroup,
}) => {
  const {protocolItemGroup, items} = protocolItemGroupWithItems;
  const isGrouped = useMemo(() => Boolean(protocolItemGroup), [protocolItemGroup]);
  const groupVotesCount = useMemo(() => protocolItemGroup?.actions?.length ?? 0, [protocolItemGroup?.actions]);
  const {currentUser} = useMiterContext();
  const isGroupVotedByCurrentUser = useMemo(
    () => Boolean(protocolItemGroup?.actions?.find(({creatorId}) => creatorId === currentUser?.userId)),
    [protocolItemGroup?.actions, currentUser]
  );
  const {isDragging} = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
  }));
  const [{isOverCurrent, canDrop}, drop] = useDrop(
    () => ({
      accept: 'protocol-item',
      drop: async ({item, group}: DraggedItem) => {
        const newGroup = protocolItemGroup?.id ?? null;
        if (item.parentId === newGroup) return;
        await updateProtocolItemGroup(item.id, newGroup);

        if (group.items.length === 2) {
          const remainingItem = group.items.find(({id}) => id !== item.id);
          await updateProtocolItemGroup(remainingItem!.id, null);

          if (group.protocolItemGroup?.id) deleteProtocolItem(group.protocolItemGroup.id);
        }
      },
      collect: monitor => {
        const draggedItem = monitor.getItem();
        const draggedItemGroupId = draggedItem?.item?.parentId ?? null;
        const groupId = protocolItemGroup?.id ?? null;
        const isDraggingFromOtherGroup = draggedItemGroupId !== groupId;

        return {
          isOverCurrent: monitor.isOver({shallow: true}),
          canDrop: isGrouped && isDraggingFromOtherGroup,
        };
      },
    }),
    []
  );

  const handleVote = useCallback(
    (item: ProtocolItem) => {
      onVote(isGrouped ? protocolItemGroup! : item);
    },
    [onVote, protocolItemGroup, isGrouped]
  );

  const DraggableProtocolItems = useMemo(() => {
    {
      return items.map((item: ProtocolItem, index: number) => {
        const isLastItem = index === items.length - 1;
        const votesCount = isGrouped ? groupVotesCount : item.actions?.length ?? 0;
        const isVotedByCurrentUser = isGrouped
          ? isGroupVotedByCurrentUser
          : Boolean(item.actions?.find(({creatorId}) => creatorId === currentUser?.userId));

        return (
          <DraggableProtocolItem
            groupVotesCount={votesCount}
            isGroupVotedByCurrentUser={isVotedByCurrentUser}
            hideVoteCount={isGrouped && !isLastItem}
            key={item.id}
            item={item}
            group={protocolItemGroupWithItems}
            onVote={handleVote}
            isGrouped={isGrouped}
            onCreateGroup={onCreateGroup}
          />
        );
      });
    }
  }, [
    items,
    groupVotesCount,
    isGrouped,
    isGroupVotedByCurrentUser,
    currentUser,
    handleVote,
    onCreateGroup,
    protocolItemGroupWithItems,
  ]);

  return (
    <div
      key={protocolItemGroup?.id ?? 'null'}
      ref={isGrouped ? drop : null}
      className={classNames('Group', {
        isDraggingOverCurrentGroup: canDrop && isOverCurrent,
        isDragging: isGrouped && items.length && isDragging,
        isGrouped,
        isEmpty: !items.length,
      })}
    >
      {isGrouped && (
        <div onClick={() => onEditGroup?.(protocolItemGroup as ProtocolItem)} className="GroupName">
          {protocolItemGroup!.text}
        </div>
      )}
      {!items.length && (
        <div className="EmptyGroup">{isGrouped ? 'Empty group: drag ideas here' : 'Items Without A Group'}</div>
      )}
      {DraggableProtocolItems}
    </div>
  );
};

export default ProtocolItemGroup;
