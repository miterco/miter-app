import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {ProtocolItem} from 'miter-common/SharedTypes';
import {useMiterContext} from 'model/MiterContextProvider';
import {createProtocolItem, updateProtocolItem} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {FC, useCallback, useEffect, useMemo, useState} from 'react';
import {waitATick} from 'Utils';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';

const MinimumRequiredItems = 3;

const MultipleResponsesPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol} = useProtocolContext();
  const {currentUser} = useMiterContext();
  const [userInput, setUserInput] = useState('');

  const items = useMemo(
    () =>
      // Sort the protocol items by creation date.
      currentProtocol?.items?.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }) || [],

    [currentProtocol]
  );

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  useEffect(() => {
    if (items) waitATick(() => setInitialLoadComplete(true));
  }, [items]);

  const handleCollectInput = useCallback(async () => {
    if (!currentProtocol?.id || !userInput) return;

    try {
      createProtocolItem(currentProtocol.id, userInput);
      setUserInput('');
    } catch (error) {
      console.error('MultipleResponsesPhaseView failed to create the protocol item');
    }
  }, [currentProtocol, setUserInput, userInput]);

  const handleMoveToNextPhase = useCallback(async () => {
    handleCollectInput();
    moveToNextPhase();
  }, [moveToNextPhase, handleCollectInput]);

  const handleEditItem = useCallback(async (newText: string, protocolItemId: string) => {
    await updateProtocolItem(protocolItemId, newText);
  }, []);

  const handleSubmit = useCallback(
    (item: ProtocolItem) => (newText: string) => handleEditItem(newText, item.id),
    [handleEditItem]
  );

  const handleChange = useCallback((newText: string) => setUserInput(newText), [setUserInput]);

  return (
    <>
      <div className="ProtocolDrawerBody">
        {currentProtocol?.items?.map(item => (
          <ProtocolCard
            key={item.id}
            id={item.id}
            text={item.text}
            mode={ProtocolCardMode.View}
            user={item.creator}
            showAvatar
            animateIn={initialLoadComplete}
            onSubmit={handleSubmit(item)}
          />
        ))}

        <ProtocolCard
          onChange={handleChange}
          onSubmit={handleCollectInput}
          text={userInput}
          mode={ProtocolCardMode.Input}
          isEditing
          showAvatar
          user={currentUser}
          placeholder="Add an option"
          shouldInitFocused
        />
      </div>
      <ProtocolDrawerFooter
        button={{
          disabled: items?.length < MinimumRequiredItems,
          label: nextPhase?.name || 'Close',
          hasIcon: Boolean(nextPhase),
          onClick: handleMoveToNextPhase,
        }}
      />
    </>
  );
};

export default MultipleResponsesPhaseView;
