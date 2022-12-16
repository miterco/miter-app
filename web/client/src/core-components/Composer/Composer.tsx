import React, {useState, useCallback} from 'react';
import {Input} from 'antd';
import './Composer.less';
import {track, waitATick} from 'Utils';
import Button, {ButtonType} from 'basic-components/Button';
import ToggleEdit from 'basic-components/ToggleEdit';
import {AddNoteIcon as SendIcon} from 'image';
import {ItemType} from 'miter-common/SharedTypes';
import ItemTypeIcon from '../ItemTypeIcon';

interface ComposerProps {
  placeholder?: string;
  onCreateNote: (text: string) => void;
  itemType: ItemType;
  onKeyPress: () => void;
}

const Composer = React.forwardRef<HTMLDivElement, ComposerProps>(
  ({placeholder, onCreateNote, itemType, onKeyPress}, ref) => {
    const [value, setValue] = useState('');
    const [editing, setEditing] = useState(true);

    const handleChange = useCallback((value: string) => {
      setValue(oldValue => {
        if (value && !oldValue) track('Start Typing in Composer');
        return value;
      });
    }, []);

    const sendNote = useCallback(
      (valueFromToggleEdit: string, element?: HTMLElement) => {
        const trimmedValue = valueFromToggleEdit.trim() || value.trim();

        if (trimmedValue) {
          onCreateNote(trimmedValue);
          track('Create Note');
        }

        setEditing(false);
        waitATick(() => setEditing(true));
      },
      [value, onCreateNote]
    );

    const handleKeyPress = useCallback(() => {
      onKeyPress();
    }, [onKeyPress]);

    return (
      <div className="Composer">
        <ToggleEdit
          className="Input"
          key="composerInput"
          editing={editing}
          placeholder={placeholder || 'Type something'}
          withMentions
          shouldSave={sendNote}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          ref={ref}
          value=""
        />

        <Button
          type={ButtonType.borderless}
          disabled={value.trim() === ''}
          className="Borderless"
          onClick={() => sendNote('')}
          icon={<SendIcon />}
        >
          {itemType !== 'None' && (
            <div className="Badge">
              <ItemTypeIcon type={itemType} />
            </div>
          )}
        </Button>
      </div>
    );
  }
);

export default Composer;
