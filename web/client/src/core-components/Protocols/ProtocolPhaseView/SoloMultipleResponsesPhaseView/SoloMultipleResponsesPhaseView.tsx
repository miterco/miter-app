import Button, {ButtonType} from 'basic-components/Button';
import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {useMiterContext} from 'model/MiterContextProvider';
import {createProtocolItem, updateProtocolItem} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {FC, useCallback, useEffect, useMemo, useState} from 'react';
import {waitATick} from 'Utils';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';
import '../ProtocolPhaseView.less';
import {ProtocolItemType} from 'miter-common/SharedTypes';

const MinimumRequiredItems = 1;

const SoloMultipleResponsesPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol, isEveryoneDone, isSoloStateCompleted, setIsSoloStateCompleted} = useProtocolContext();
  const {currentUser} = useMiterContext();
  const [userInput, setUserInput] = useState('');

  const items = useMemo(
    () =>
      // Sort the protocol items by creation date.
      currentProtocol?.items
        ?.filter(({creatorId, type}) => type === ProtocolItemType.Item && creatorId === currentUser?.userId) // Don't show items from other users.
        .sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }) || [],
    [currentProtocol?.items, currentUser?.userId]
  );

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  useEffect(() => {
    if (items) waitATick(() => setInitialLoadComplete(true));
  }, [items]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                               PHASE INITIALIZATION
  // -------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (items.length === 0) setIsSoloStateCompleted(false);
  }, [items, setIsSoloStateCompleted]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                               CREATE ITEM HANDLER
  // -------------------------------------------------------------------------------------------------------------------
  const handleCreateItem = useCallback(async () => {
    if (!currentProtocol?.id || !userInput) return;

    try {
      createProtocolItem(currentProtocol.id, userInput);
      setUserInput('');
    } catch (error) {
      console.error('SoloMultipleResponsesPhaseView failed to create the protocol item');
    }
  }, [currentProtocol, setUserInput, userInput]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                                NEXT PHASE BUTTON
  // -------------------------------------------------------------------------------------------------------------------
  const handleNextButton = useCallback(() => {
    if (isSoloStateCompleted) moveToNextPhase();
    else {
      handleCreateItem();
      setIsSoloStateCompleted(true);
    }
  }, [isSoloStateCompleted, moveToNextPhase, setIsSoloStateCompleted, handleCreateItem]);

  const isNextButtonEnabled = useMemo(() => {
    if (!isSoloStateCompleted) return items?.length >= MinimumRequiredItems;
    else return (currentProtocol?.isCompleted || isEveryoneDone) && currentProtocol?.readyForNextPhase;
  }, [currentProtocol, isSoloStateCompleted, items, isEveryoneDone]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                                  RENDERING
  // -------------------------------------------------------------------------------------------------------------------

  const handleEditItem = useCallback(async (newText: string, protocolItemId: string) => {
    await updateProtocolItem(protocolItemId, newText);
  }, []);

  const handleChange = useCallback((newValue: string) => setUserInput(newValue), [setUserInput]);

  return (
    <>
      <div className="ProtocolDrawerBody">
        {items.map(item => (
          <ProtocolCard
            id={item.id}
            key={item.id}
            text={item.text}
            mode={ProtocolCardMode.View}
            animateIn={initialLoadComplete}
            user={item.creator}
            onSubmit={(newText: string) => handleEditItem(newText, item.id)}
            shouldInitFocused
          />
        ))}

        {!isSoloStateCompleted && (
          <ProtocolCard
            onSubmit={handleCreateItem}
            onChange={handleChange}
            text={userInput}
            mode={ProtocolCardMode.Input}
            placeholder={items.length ? 'Add more ideas...' : 'Add your first idea...'}
            shouldInitFocused
          />
        )}

        {isSoloStateCompleted && (
          <Button className="ReopenButton" type={ButtonType.placeholder} onClick={() => setIsSoloStateCompleted(false)}>
            Go back and add more...
          </Button>
        )}
      </div>
      <ProtocolDrawerFooter
        button={{
          disabled: !isNextButtonEnabled,
          label: !isSoloStateCompleted ? 'Done' : nextPhase?.name || 'Close',
          hasIcon: Boolean(isSoloStateCompleted && nextPhase),
          onClick: handleNextButton,
        }}
      />
    </>
  );
};

export default SoloMultipleResponsesPhaseView;
