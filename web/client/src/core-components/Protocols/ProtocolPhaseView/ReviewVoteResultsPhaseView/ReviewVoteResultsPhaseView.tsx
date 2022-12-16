import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {DeprioritizeIcon, StarIcon} from 'image';
import {prioritizeProtocolItem} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {FC, useMemo} from 'react';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';
import {prioritizeItems} from 'miter-common/logic/protocol-summary-strategies';

// ---------------------------------------------------------------------------------------------------------------------
//                                     REVIEW VOTE RESULTS PHASE VIEW COMPONENT
// ---------------------------------------------------------------------------------------------------------------------
const ReviewVoteResultsPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol} = useProtocolContext();
  const items = useMemo(() => prioritizeItems(currentProtocol?.items), [currentProtocol?.items]);

  return (
    <>
      <div className="ProtocolDrawerBody">
        {items.map(({item, isPrioritized, isReprioritized, isDeprioritized}) => (
          <ProtocolCard
            key={item.id}
            text={item.text}
            mode={ProtocolCardMode.VoteSummary}
            votes={item.actions?.length}
            isChecked={isPrioritized}
            isReprioritized={isReprioritized}
            isDeprioritized={isDeprioritized}
            contextMenuItems={[
              {
                title: 'Prioritize',
                onSelect: () => prioritizeProtocolItem(item.id, true),
                key: 'prioritize',
                icon: <StarIcon />,
                isDisabled: isPrioritized,
              },
              {
                title: 'Deprioritize',
                onSelect: () => prioritizeProtocolItem(item.id, false),
                key: 'deprioritize',
                icon: <DeprioritizeIcon />,
                isDisabled: !isPrioritized,
              },
            ]}
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

export default ReviewVoteResultsPhaseView;
