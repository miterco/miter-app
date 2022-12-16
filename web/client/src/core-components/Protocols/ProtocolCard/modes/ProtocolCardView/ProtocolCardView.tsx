// Vendor
import {FC, useCallback, useEffect, useMemo, useState} from 'react';

// Types
import {Person} from 'miter-common/SharedTypes';

// Components
import Avatar from 'basic-components/Avatar';
import ContextMenu, {ContextMenuItem} from 'basic-components/ContextMenu';
import {useMiterContext} from 'model/MiterContextProvider';
import {deleteProtocolItem} from 'model/ProtocolApi';
import ProtocolCard from '../../ProtocolCard';
import {ProtocolCardMode} from '../../ProtocolCard.types';
import {PencilIcon} from 'image';
import classNames from 'classnames';
import useBooleanSwitch from 'hooks/use-boolean-switch';

export interface ProtocolCardViewProps {
  user?: Person;
  text: string;
  showAvatar?: boolean;
  id: string;
  onSubmit?: (newText: string, id?: string) => void;
}

const ProtocolCardView: FC<ProtocolCardViewProps> = ({user, text, showAvatar, id, onSubmit}) => {
  const {currentUser} = useMiterContext();
  const [isEditing, startEditing, stopEditing] = useBooleanSwitch();
  const [userInput, setUserInput] = useState(text);
  const isCardOwner = useMemo(() => currentUser?.userId === user?.userId, [currentUser, user]);

  const contextMenuItems: Array<ContextMenuItem> = useMemo(
    () => [
      {
        key: 'edit',
        title: 'Edit Note',
        onSelect: startEditing,
        isHidden: !isCardOwner,
      },
      {
        key: 'delete',
        title: 'Delete Note',
        onSelect: () => {
          deleteProtocolItem(id);
        },
        isHidden: !isCardOwner,
      },
    ],
    [isCardOwner, id, startEditing]
  );

  const handleSubmit = useCallback(() => {
    onSubmit?.(userInput, id);
    stopEditing();
  }, [onSubmit, stopEditing, userInput, id]);

  useEffect(() => {
    setUserInput(text);
    if (isEditing) stopEditing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleDoubleClick = useCallback(() => {
    if (isCardOwner) {
      startEditing();
    }
  }, [isCardOwner, startEditing]);

  const handleChange = useCallback((newText: string) => setUserInput(newText), [setUserInput]);

  return isEditing ? (
    <ProtocolCard
      onChange={handleChange}
      onSubmit={handleSubmit}
      onBlur={stopEditing}
      text={userInput}
      mode={ProtocolCardMode.Input}
      showAvatar={showAvatar}
      user={user}
      placeholder="Edit"
      submitButtonIcon={PencilIcon}
      shouldInitFocused
    />
  ) : (
    <ContextMenu menuItems={contextMenuItems}>
      <div className={classNames('ProtocolCard ViewMode', {Editable: isCardOwner})} onDoubleClick={handleDoubleClick}>
        {showAvatar && (
          <div className="Start">
            <Avatar size={26} user={user} />
          </div>
        )}
        <div className="Body">{text}</div>
      </div>
    </ContextMenu>
  );
};

export default ProtocolCardView;
