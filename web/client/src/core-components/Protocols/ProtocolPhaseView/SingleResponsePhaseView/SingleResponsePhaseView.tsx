import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {useMiterContext} from 'model/MiterContextProvider';
import {FC, useCallback, useEffect, useMemo, useState} from 'react';
import {createProtocolItem, updateProtocolItem} from 'model/ProtocolApi';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';

const SingleResponsePhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol, isSoloStateCompleted, isEveryoneDone, setIsSoloStateCompleted} = useProtocolContext();
  const {currentUser} = useMiterContext();
  const [userInput, setUserInput] = useState('');
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  // -------------------------------------------------------------------------------------------------------------------
  //                                              PHASE INITIALIZATION
  // -------------------------------------------------------------------------------------------------------------------
  const userProtocolItem = useMemo(
    () => currentProtocol?.items?.find(item => item.creatorId === currentUser?.userId),
    [currentProtocol, currentUser]
  );

  // Update the item text when the data changes. If there is no created item yet, just set it to an empty string.
  useEffect(() => {
    setUserInput(userProtocolItem?.text || '');
  }, [userProtocolItem?.text]);

  // Update the solo-state when an item is created by the user.
  useEffect(() => {
    if (userProtocolItem?.id) {
      // There's an item created by the current user already. Initialize the state with that item data.
      setCurrentItemId(userProtocolItem.id);
      setIsSoloStateCompleted(true);
    } else {
      setIsSoloStateCompleted(false);
    }
  }, [setIsSoloStateCompleted, userProtocolItem?.id]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                               NEXT PHASE BUTTON
  // -------------------------------------------------------------------------------------------------------------------
  const isNextButtonEnabled = useMemo(() => {
    if (isSoloStateCompleted) {
      // Don't wait for other users if this protocol was already completed.
      return (currentProtocol?.isCompleted || isEveryoneDone) && currentProtocol?.readyForNextPhase;
    } else {
      return userInput.length > 0;
    }
  }, [isSoloStateCompleted, isEveryoneDone, currentProtocol, userInput.length]);

  const handleNextPhaseButton = useCallback(async () => {
    if (isSoloStateCompleted) moveToNextPhase();
    else if (currentItemId) updateProtocolItem(currentItemId, userInput);
    else if (currentProtocol?.id) createProtocolItem(currentProtocol.id, userInput);
    setIsSoloStateCompleted(true);
  }, [isSoloStateCompleted, moveToNextPhase, currentProtocol?.id, userInput, currentItemId, setIsSoloStateCompleted]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                               EDIT ITEM HANDLER
  // -------------------------------------------------------------------------------------------------------------------

  const handleProtocolCardEdit = useCallback(() => setIsSoloStateCompleted(false), [setIsSoloStateCompleted]);

  return (
    <>
      <div className="ProtocolDrawerBody SingleResponse">
        <ProtocolCard
          onChange={setUserInput}
          text={userInput}
          mode={ProtocolCardMode.Preview}
          isEditing={!isSoloStateCompleted}
          onEdit={handleProtocolCardEdit}
          user={currentUser}
          showAvatar
          showSubmitButton
          onSubmit={handleNextPhaseButton}
        />
      </div>
      <ProtocolDrawerFooter
        button={{
          disabled: !isNextButtonEnabled,
          label: !isSoloStateCompleted ? 'Done' : nextPhase?.name || 'Close',
          hasIcon: isSoloStateCompleted && Boolean(nextPhase),
          onClick: handleNextPhaseButton,
        }}
      />
    </>
  );
};

export default SingleResponsePhaseView;
