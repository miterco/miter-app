import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {useMiterContext} from 'model/MiterContextProvider';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {
  createProtocolItemAction,
  deleteProtocolItem,
  deleteProtocolItemAction,
  updateMultipleProtocolItemsGroup,
  updateProtocolItemGroup,
} from 'model/ProtocolApi';
import {ComponentType, FC, useCallback, useMemo, useState} from 'react';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';
import {ProtocolItem, ProtocolItemAction, ProtocolItemActionType, ProtocolItemType} from 'miter-common/SharedTypes';
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import {AddIcon} from 'image';
import {DndProvider, useDragLayer, useDrop} from 'react-dnd';

// Styles
import './OrganizeContentListPhaseView.less';
import ProtocolItemGroup, {DraggedItem, ProtocolItemGroupWithItems} from './ProtocolItemGroup/ProtocolItemGroup';
import AddGroupModal from './AddGroupModal/AddGroupModal';
import classNames from 'classnames';
import {HTML5Backend} from 'react-dnd-html5-backend';

const OrganizeContentListPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol} = useProtocolContext();
  const {currentUser} = useMiterContext();
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [itemsToGroup, setItemsToGroup] = useState<ProtocolItem[]>([]);
  const [groupToEdit, setGroupToEdit] = useState<ProtocolItem | null>(null);

  const {isDragging} = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
  }));
  const [{isOverCurrent, canDrop}, drop] = useDrop(
    () => ({
      accept: 'protocol-item',
      drop: async ({item, group}: DraggedItem, monitor) => {
        const isOverCurrent = monitor.isOver({shallow: true});
        if (!isOverCurrent) return;
        updateProtocolItemGroup(item.id, null);

        if (group.items.length === 2) {
          const remainingItem = group.items.find(({id}) => id !== item.id);
          await updateProtocolItemGroup(remainingItem!.id, null);

          if (group.protocolItemGroup?.id) deleteProtocolItem(group.protocolItemGroup.id);
        }
      },
      collect: monitor => {
        const draggedItem = monitor.getItem();
        const isDraggingFromGroup = draggedItem?.item.parentId !== null;

        return {
          isOverCurrent: monitor.isOver({shallow: true}),
          canDrop: isDraggingFromGroup,
        };
      },
    }),
    []
  );

  const toggleVote = useCallback(
    async item => {
      // Unauthenticated users aren't allowed to vote.
      if (!currentUser?.userId) return;

      const vote = item.actions.find(
        (action: ProtocolItemAction) =>
          action.type === ProtocolItemActionType.Vote && action.creatorId === currentUser?.userId
      );
      if (vote) await deleteProtocolItemAction(vote.id);
      else await createProtocolItemAction(item.id, ProtocolItemActionType.Vote);
    },
    [currentUser?.userId]
  );

  const showPrompt = useCallback(() => {
    setShowAddGroupModal(true);
  }, []);

  const protocolItems = useMemo(
    () => currentProtocol?.items?.filter(({type}) => type === ProtocolItemType.Item) || [],
    [currentProtocol?.items]
  );

  const protocolItemsWithoutGroup: ProtocolItemGroupWithItems = useMemo(
    () => ({items: protocolItems.filter(({parentId}) => !parentId)}),
    [protocolItems]
  );

  const protocolItemGroups = useMemo(
    () => currentProtocol?.items?.filter(({type}) => type === ProtocolItemType.Group) || [],
    [currentProtocol?.items]
  );

  const groupedProtocolItems = protocolItemGroups.reduce(
    (acc, group) => ({
      ...acc,
      [group.id]: {
        protocolItemGroup: group,
        items: protocolItems.filter(({parentId}) => parentId === group.id),
      },
    }),
    {} as Record<string, ProtocolItemGroupWithItems>
  );

  const handleCreateGroup = useCallback((itemsToGroup: ProtocolItem[]) => {
    setItemsToGroup(itemsToGroup);
    setShowAddGroupModal(true);
  }, []);

  const handleEditGroup = useCallback((protocolItemGroup: ProtocolItem) => {
    setGroupToEdit(protocolItemGroup);
    setShowAddGroupModal(true);
  }, []);

  const handleCreateGroupClose = useCallback(
    (group?: ProtocolItem) => {
      setShowAddGroupModal(false);
      if (groupToEdit) setGroupToEdit(null);
      if (group && itemsToGroup.length > 0) {
        const itemsToGroupIds = itemsToGroup.map(({id}) => id);
        updateMultipleProtocolItemsGroup(itemsToGroupIds, group.id);
        setItemsToGroup([]);
      }
    },
    [groupToEdit, itemsToGroup]
  );

  return (
    <>
      <div
        ref={drop}
        className={classNames('ProtocolDrawerBody OrganizeContentListPhaseView', {
          isDragging,
          isDraggingOverCurrentGroup: canDrop && isOverCurrent,
        })}
      >
        <div className="Dropzone">
          {protocolItemGroups.map(protocolItemGroup => (
            <ProtocolItemGroup
              key={protocolItemGroup.id}
              onVote={toggleVote}
              protocolItemGroupWithItems={groupedProtocolItems[protocolItemGroup.id]}
              onEditGroup={handleEditGroup}
            />
          ))}
          <ProtocolItemGroup
            onVote={toggleVote}
            protocolItemGroupWithItems={protocolItemsWithoutGroup}
            onCreateGroup={handleCreateGroup}
          />
        </div>
      </div>
      <AddGroupModal groupToEdit={groupToEdit} open={showAddGroupModal} onClose={handleCreateGroupClose} />

      <ProtocolDrawerFooter
        button={{
          disabled: !currentProtocol?.readyForNextPhase || false,
          label: nextPhase?.name || 'Close',
          hasIcon: Boolean(nextPhase),
          onClick: moveToNextPhase,
        }}
      >
        <div className="ProtocolDrawerFooterAuxButtons">
          <Button onClick={showPrompt} type={ButtonType.placeholder} size={ButtonSize.small} icon={<AddIcon />}>
            Add Group
          </Button>
        </div>
      </ProtocolDrawerFooter>
    </>
  );
};

const withDnD =
  <C extends ProtocolPhaseViewProps>(Component: ComponentType<C>) =>
  (props: C) =>
    (
      <DndProvider backend={HTML5Backend}>
        <Component {...props} />
      </DndProvider>
    );

export default withDnD(OrganizeContentListPhaseView);
