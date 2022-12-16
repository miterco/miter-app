import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {updateProtocolItem} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {FC, useCallback} from 'react';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';

const ContentListPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol} = useProtocolContext();

  const handleEditItem = useCallback(async (newText: string, protocolItemId: string) => {
    await updateProtocolItem(protocolItemId, newText);
  }, []);

  return (
    <>
      <div className="ProtocolDrawerBody">
        {currentProtocol?.items?.map(item => (
          <ProtocolCard
            id={item.id}
            key={item.id}
            text={item.text}
            mode={ProtocolCardMode.View}
            user={item.creator}
            showAvatar
            onSubmit={(newText: string) => handleEditItem(newText, item.id)}
          />
        ))}
      </div>
      <ProtocolDrawerFooter
        button={{
          disabled: false,
          label: nextPhase?.name || 'Close',
          hasIcon: Boolean(nextPhase),
          onClick: moveToNextPhase,
        }}
      />
    </>
  );
};

export default ContentListPhaseView;
