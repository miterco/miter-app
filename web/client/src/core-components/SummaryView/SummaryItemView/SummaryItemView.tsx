// Vendor
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

// Components
import Avatar from 'basic-components/Avatar';
import {BaseSummaryItemView} from '../BaseSummaryItemView';
import DatePicker from 'basic-components/DatePicker';
import {ContextMenuItem} from 'basic-components/ContextMenu';
import ToggleEdit, {StartEditingAction} from 'basic-components/ToggleEdit';

// Types
import {createSummaryItem, editSummaryItem, deleteSummaryItem} from 'model/SummaryApi';
import {
  UpdateSummaryItemRequest,
  ItemType,
  MeetingWithTokenValue,
  Person,
  SummaryItem,
  Topic,
  UnsavedSummaryItem,
} from 'miter-common/SharedTypes';

// Context
import {useMiterContext} from 'model/MiterContextProvider';

interface SummaryItemViewProps {
  item: SummaryItem | UnsavedSummaryItem;
  context?: {meeting: MeetingWithTokenValue; topic: Topic | null} | {meeting: null}; // For display outside a meeting
  owner?: Person;
  autoFocus?: boolean;
  onEndEditing?: () => void;
  animateIn?: boolean;
}

const Placeholders: Record<ItemType, string> = {
  Decision: 'Add your decision',
  Pin: 'Add starred note',
  Task: 'Add action item',
  None: '',
};

const getItemChanges = (oldItem: SummaryItem | UnsavedSummaryItem, newItem: SummaryItem | UnsavedSummaryItem) => {
  if (!newItem.itemText) return null;

  const result: Omit<UpdateSummaryItemRequest, 'id'> = {};
  if (oldItem.itemText !== newItem.itemText && newItem.itemText) result.itemText = newItem.itemText;
  if (oldItem.itemText2 !== newItem.itemText2 && newItem.itemText2) result.itemText2 = newItem.itemText2;
  if (oldItem.targetDate?.toString() !== newItem.targetDate?.toString()) result.targetDate = newItem.targetDate;
  if (oldItem.topicId !== newItem.topicId && newItem.topicId !== undefined) result.topicId = newItem.topicId;
  if (oldItem.taskProgress !== newItem.taskProgress) result.taskProgress = newItem.taskProgress;

  if (Object.keys(result).length) return result;

  return null;
};

const SummaryItemView: React.FC<SummaryItemViewProps> = ({
  item,
  context,
  owner: ownerProp,
  autoFocus,
  onEndEditing,
  animateIn,
}) => {
  const {attendees, relevantPeople} = useMiterContext();
  const [currentItem, setCurrentItem] = useState({...item});
  const [isEditing, setIsEditing] = useState(autoFocus || false);
  const [isEditingText, setIsEditingText] = useState(autoFocus || false);
  const [shouldStopEditing, setShouldStopEditing] = useState(false);
  const [valueForEditingOwner, setValueForEditingOwner] = useState<string | null>(null);
  const focusTimer = useRef<number | null>(null);

  /*
   * Prop-based changes to the summary item should precedence over state-based ones.
   */
  useEffect(() => {
    setCurrentItem({...item});
  }, [item]);

  useEffect(() => {
    if (shouldStopEditing) {
      setShouldStopEditing(false);
      setIsEditing(false);
      setIsEditingText(false);
      const changes = getItemChanges(item, currentItem);
      if (changes) {
        if (item.id) editSummaryItem({...changes, id: item.id});
        else {
          createSummaryItem(
            {
              ...currentItem,
              id: undefined,
              meetingId: undefined,
              createdBy: undefined,
              systemMessageType: undefined,
            },
            Boolean(context && !context.meeting)
          );
        }
      }
      if (onEndEditing) onEndEditing();
    }
    // eslint-disable-next-line
  }, [shouldStopEditing]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (valueForEditingOwner !== newContent && currentItem.itemText !== newContent) {
        setCurrentItem(prevItem => ({...prevItem, itemText: newContent}));
      }

      setValueForEditingOwner(null);
      setShouldStopEditing(true);
    },
    [currentItem.itemText, valueForEditingOwner]
  );

  const handleTargetDateChange = useCallback(
    (newDate: Date | null) => {
      if (currentItem.targetDate !== newDate) {
        setCurrentItem(prevItem => ({...prevItem, targetDate: newDate}));
      }
    },
    [currentItem.targetDate]
  );

  const handleToggleCompletion = useCallback(() => {
    setCurrentItem(prevItem => ({
      ...prevItem,
      taskProgress: prevItem.taskProgress === 'Completed' ? 'None' : 'Completed',
    }));
    setShouldStopEditing(true);
  }, []);

  const handleBlur = () => {
    // Wait a tick in case the user has focused another sub-field
    focusTimer.current = window.setTimeout(() => {
      // OK, at this point none of our subfields has focus so we save or exit
      focusTimer.current = null;
      setShouldStopEditing(true);
    }, 0);
  };

  const handleFocus = useCallback(() => {
    if (focusTimer.current) {
      // This focus happened after a blur
      window.clearTimeout(focusTimer.current);
      focusTimer.current = null;
    }
    setIsEditing(true);
  }, []);

  const handleEditAction = useCallback(() => {
    handleFocus();
    setIsEditingText(true);
  }, [handleFocus]);

  const handleRemove = useCallback(() => {
    if (item.id) {
      deleteSummaryItem(item);
    } else {
      throw new Error('Attempted to un-pin an unsaved item.');
    }
  }, [item]);

  const handleInputShouldEdit = useCallback((action: StartEditingAction) => {
    if (action === 'EnterKey') {
      setIsEditing(true);
      setIsEditingText(true);
    }
  }, []);

  const type = item.itemType;

  const author = useMemo(
    () => (currentItem.createdBy ? attendees[currentItem.createdBy] || {} : {}),
    [currentItem, attendees]
  );

  const owner = useMemo(() => {
    if (ownerProp) return ownerProp;

    return relevantPeople.find(p => p.id === currentItem.itemOwnerId);
  }, [currentItem, relevantPeople, ownerProp]);

  const secondaryItem = useMemo(() => {
    return type === 'Task' ? (
      <DatePicker
        value={currentItem.targetDate ? new Date(currentItem.targetDate) : null}
        placeholder="No Date"
        onChange={handleTargetDateChange}
      />
    ) : (
      <Avatar user={author} size={20} />
    );
  }, [currentItem.targetDate, author, handleTargetDateChange, type]);

  const ownerAvatar = useMemo(() => {
    if (currentItem.itemType !== 'Task') return null;

    const handleClick = () => {
      let text = currentItem.itemText || '';

      if (text.startsWith(owner?.email || '')) {
        text = `@${text.substring((owner?.email?.length || 0) + 1)}`;
      } else {
        text = `@${text}`;
      }

      setValueForEditingOwner(text);
      setIsEditingText(true);
    };

    const ownerName = owner?.displayName || owner?.email || 'Unknown Person';

    return (
      <Avatar className="OwnerAvatar" onClick={handleClick} user={owner} tooltip={`${ownerName} - Click to change`} />
    );
  }, [currentItem.itemText, currentItem.itemType, owner]);

  const contextMenuItems: Array<ContextMenuItem> = [
    {
      key: 'edit',
      title: 'Edit',
      onSelect: handleEditAction,
    },
    {
      key: 'remove',
      title: 'Delete',
      onSelect: handleRemove,
    },
  ];

  return (
    <BaseSummaryItemView
      animateIn={animateIn}
      context={context as {meeting: MeetingWithTokenValue; topic: Topic | null}}
      isEditing={isEditing}
      item={item}
      topRow={secondaryItem}
      contextMenuItems={contextMenuItems}
      handleFocus={handleFocus}
      handleBlur={handleBlur}
      handleEditAction={handleEditAction}
      handleToggleCompletion={handleToggleCompletion}
    >
      {ownerAvatar}
      <ToggleEdit
        editing={isEditingText}
        className="Content"
        value={valueForEditingOwner || item.itemText || ''}
        initialCaretPosition={valueForEditingOwner ? 1 : undefined}
        linkifyUrls
        shouldSave={handleContentChange}
        onBlur={handleContentChange}
        autoOpenMentionsDropdown={valueForEditingOwner !== null}
        shouldStartEditing={handleInputShouldEdit}
        withMentions
        placeholder={item.itemType ? Placeholders[item.itemType] : undefined}
      />
    </BaseSummaryItemView>
  );
};

export default SummaryItemView;
