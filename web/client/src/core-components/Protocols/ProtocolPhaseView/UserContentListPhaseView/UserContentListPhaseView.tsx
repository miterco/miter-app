import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import Avatar from 'basic-components/Avatar';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {useMiterContext} from 'model/MiterContextProvider';
import {FC, useCallback, useMemo, useState} from 'react';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';
import {Person, ProtocolItem, ProtocolItemType} from 'miter-common/SharedTypes';
import './UserContentListPhaseView.less';
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import {AddIcon} from 'image';
import {createProtocolItem, updateProtocolItem} from 'model/ProtocolApi';
import classNames from 'classnames';

interface UserContentObject {
  user: Person;
  items: ProtocolItem[];
}

const UserContentListPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol} = useProtocolContext();
  const {attendees} = useMiterContext();
  const [showInput, setShowInput] = useState(false);
  const [userInput, setUserInput] = useState('');

  const protocolItems = useMemo(
    () => currentProtocol?.items?.filter(({type}) => type === ProtocolItemType.Item),
    [currentProtocol?.items]
  );

  const itemsByUser = useMemo(() => {
    const userContentMap: Record<string, ProtocolItem[]> = {};

    if (protocolItems) {
      for (const item of protocolItems) {
        if (!(item.creatorId in userContentMap)) userContentMap[item.creatorId] = [item];
        else userContentMap[item.creatorId].push(item);
      }
    }

    return userContentMap;
  }, [protocolItems]);

  const handleEditItem = useCallback(async (newText: string, protocolItemId: string) => {
    await updateProtocolItem(protocolItemId, newText);
  }, []);

  const toggleShowInput = useCallback(() => {
    setShowInput(_showInput => !_showInput);
  }, []);

  const handleCreateItem = useCallback(async () => {
    if (!currentProtocol?.id || !userInput) return;

    try {
      createProtocolItem(currentProtocol.id, userInput);
      setUserInput('');
    } catch (error) {
      console.error('UserContentListPhaseView failed to create the protocol item');
    }
  }, [currentProtocol?.id, setUserInput, userInput]);

  const handleChange = useCallback((newUserInput: string) => setUserInput(newUserInput), [setUserInput]);

  return (
    <>
      <div className="ProtocolDrawerBody UserContentListPhaseView">
        {Object.keys(itemsByUser).map(userId => (
          <section key={userId}>
            <div className="User">
              <Avatar user={attendees[userId]} />
              {attendees[userId].displayName}
            </div>

            {itemsByUser[userId].map(item => (
              <ProtocolCard
                id={item.id}
                key={item.id}
                text={item.text}
                mode={ProtocolCardMode.View}
                user={item.creator}
                onSubmit={(newText: string) => handleEditItem(newText, item.id)}
              />
            ))}
          </section>
        ))}
      </div>
      <ProtocolDrawerFooter
        button={{
          disabled: false,
          label: nextPhase?.name || 'Close',
          hasIcon: Boolean(nextPhase),
          onClick: moveToNextPhase,
        }}
        topElement={
          showInput ? (
            <ProtocolCard
              className="ProtocolDrawerFooter_AddItemCard"
              onSubmit={handleCreateItem}
              onChange={handleChange}
              onBlur={toggleShowInput}
              text={userInput}
              mode={ProtocolCardMode.Input}
              placeholder="Add an idea..."
              shouldInitFocused
            />
          ) : undefined
        }
      >
        <div className="ProtocolDrawerFooterAuxButtons">
          <Button
            className={classNames({focus: showInput})}
            onClick={toggleShowInput}
            type={ButtonType.placeholder}
            size={ButtonSize.small}
            icon={<AddIcon />}
          >
            Add idea
          </Button>
        </div>
      </ProtocolDrawerFooter>
    </>
  );
};

export default UserContentListPhaseView;
