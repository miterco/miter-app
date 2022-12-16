// Vendor
import classNames from 'classnames';
import {useMiterContext} from 'model/MiterContextProvider';
import {sendActivityPing} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {FC, useEffect, useState} from 'react';
import {ConnectDragSource} from 'react-dnd';

export interface ProtocolCardVoteProps {
  text: string;
  isChecked?: boolean;
  onVote?: (isChecked: boolean) => void;
  votes?: number;
  cardClassName?: string;
  isInteractive?: boolean;
  interactionDisabled?: boolean;
  dragRef?: ConnectDragSource;
  dropRef?: any;
  hideVoteCount?: boolean;
}

const ProtocolCardVote: FC<ProtocolCardVoteProps> = ({
  text,
  isChecked,
  onVote,
  votes,
  cardClassName,
  isInteractive = true,
  interactionDisabled,
  dragRef,
  dropRef,
  hideVoteCount,
}) => {
  const [isVotingRequestPending, setIsVotingRequestPending] = useState(false);
  const {currentProtocol} = useProtocolContext();
  const {meeting} = useMiterContext();

  useEffect(() => {
    setIsVotingRequestPending(false);
  }, [isChecked]);

  const toggleCheck = () => {
    if (isInteractive && !isVotingRequestPending) {
      onVote?.(!isChecked);
      setIsVotingRequestPending(true);

      if (currentProtocol?.id === meeting?.currentProtocolId) {
        // Report the user activity only if the current meeting protocol is open. Otherwise it will show in the
        // activity indicator of another protocol.
        sendActivityPing();
      }
    }
  };

  return (
    <div ref={dragRef} className={classNames({IsDraggable: Boolean(dragRef)})}>
      <div
        ref={dropRef}
        className={classNames(
          'ProtocolCard',
          isInteractive ? 'VoteMode' : 'VoteSummaryMode',
          {Checked: isChecked},
          {Disabled: interactionDisabled || isVotingRequestPending},
          cardClassName
        )}
        onClick={toggleCheck}
      >
        {dragRef && (
          <div className="Start">
            <div className="HandleContainer">
              <span className="Handle" />
            </div>
          </div>
        )}
        <div className="Body">{text}</div>
        {!hideVoteCount && (
          <div className="End">
            <div className="Badge">{votes}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtocolCardVote;
