// Vendor
import classNames from 'classnames';
import {FC} from 'react';
import ProtocolCardVote, {ProtocolCardVoteProps} from '../ProtocolCardVote/ProtocolCardVote';

export interface ProtocolCardVoteSummaryProps extends ProtocolCardVoteProps {
  isReprioritized: boolean;
  isDeprioritized?: boolean;
}

const ProtocolCardVoteSummary: FC<ProtocolCardVoteSummaryProps> = ({isReprioritized, isDeprioritized, ...props}) => {
  return (
    <ProtocolCardVote
      {...props}
      isInteractive={false}
      cardClassName={classNames({Reprioritized: isReprioritized, Deprioritized: isDeprioritized})}
    />
  );
};

export default ProtocolCardVoteSummary;
