// Vendor
import React, {useCallback, useMemo, useState} from 'react';
import {motion} from 'framer-motion';

// API
import {deleteNote, pinNote, editNote} from 'model/NoteApi';
import {useMiterContext} from 'model/MiterContextProvider';

// Components
import ContextMenu, {ContextMenuItem} from 'basic-components/ContextMenu';
import ItemTypeIcon from 'core-components/ItemTypeIcon';
import ToggleEdit from 'basic-components/ToggleEdit';
import TopicalAvatar from 'core-components/TopicalAvatar';

// Utils
import {KeyboardShortcuts} from 'Utils';
import {getAnimValues} from '../../NoteView.utils';

// Types
import {ItemType} from 'miter-common/SharedTypes';
import {NoteViewProps} from '../../NoteView.types';
import {useMiterTour} from 'core-components/MiterTourContextProvider';

// Styles
// import './NoteView.less';

const StandardNoteView: React.FC<NoteViewProps> = props => {
  const {note, animateIn, author, didSelectFromContextMenu, onShowContextMenu, onHideContextMenu} = props;
  const [isEditing, setIsEditing] = useState(false);
  const {getTopicById} = useMiterContext();
  const {completeTourStep} = useMiterTour();

  const setPin = useCallback(
    (selectedPin: ItemType) => {
      const newPin = note.itemType === selectedPin ? 'None' : selectedPin;
      pinNote(note, newPin);
      completeTourStep('MarkOutcome');
    },
    [completeTourStep, note]
  );

  const saveChanges = useCallback(
    (newContent: string) => {
      if (newContent !== note.itemText) {
        editNote({...note, itemText: newContent});
      }

      setIsEditing(false);
    },
    [note]
  );

  const exitEditMode = useCallback(() => setIsEditing(false), []);

  const handleContextMenuDidSelect = useCallback(
    () => didSelectFromContextMenu && didSelectFromContextMenu(),
    [didSelectFromContextMenu]
  );

  const getShortcut = useCallback(
    (itemType: ItemType) => {
      if (itemType === note.itemType) return KeyboardShortcuts.byCommand.None;
      return KeyboardShortcuts.byCommand[itemType];
    },
    [note.itemType]
  );

  const contextMenuItems: Array<ContextMenuItem> = useMemo(
    () => [
      {
        key: 'task',
        icon: <ItemTypeIcon type="Task" />,
        title: note.itemType === 'Task' ? 'Remove Action Item' : 'Mark Action Item',
        shortcut: getShortcut('Task'),
        isToggled: note.itemType === 'Task',
        isButton: true,
        onSelect: () => setPin('Task'),
      },
      {
        key: 'pin',
        icon: <ItemTypeIcon type="Pin" />,
        title: note.itemType === 'Pin' ? 'Remove Star' : 'Star this Note',
        shortcut: getShortcut('Pin'),
        isToggled: note.itemType === 'Pin',
        isButton: true,
        onSelect: () => setPin('Pin'),
      },
      {
        key: 'decision',
        icon: <ItemTypeIcon type="Decision" />,
        title: note.itemType === 'Decision' ? 'Remove Decision' : 'Record Decision',
        shortcut: getShortcut('Decision'),
        isToggled: note.itemType === 'Decision',
        isButton: true,
        onSelect: () => setPin('Decision'),
      },
      {
        key: 'edit',
        title: 'Edit Note',
        onSelect: () => setIsEditing(true),
      },
      {
        key: 'delete',
        title: 'Delete Note',
        onSelect: () => deleteNote(note),
      },
    ],
    [note, setPin, getShortcut]
  );

  const {animInitial, animAnimate} = useMemo(() => getAnimValues(animateIn), [animateIn]);

  return (
    <motion.div
      initial={animInitial}
      animate={animAnimate}
      onDoubleClick={() => setIsEditing(true)}
      data-tour="MarkOutcome"
    >
      <ContextMenu
        menuItems={contextMenuItems}
        hidden={isEditing}
        didSelect={handleContextMenuDidSelect}
        onShow={hider => onShowContextMenu && onShowContextMenu(note, hider)}
        onHide={() => onHideContextMenu && onHideContextMenu(note)}
      >
        <div className={`Note ${note.itemType !== 'None' ? 'Pinned' : ''}`}>
          <TopicalAvatar person={author} topic={getTopicById(note.topicId || null)} size={32} />
          <ToggleEdit
            editing={isEditing}
            className="Content"
            value={note.itemText}
            highlightOnHover={false}
            shouldSave={saveChanges}
            onCancel={exitEditMode}
            onBlur={saveChanges}
            linkifyUrls
            withMentions
          />
          <div className="Status">
            <ItemTypeIcon type={note.itemType} />
          </div>
        </div>
      </ContextMenu>
    </motion.div>
  );
};

export default StandardNoteView;
