import {StatusBarVariant} from 'basic-components/StatusBar';
import StatusBar from 'basic-components/StatusBar/StatusBar';
import {FC, useEffect, useMemo, useState} from 'react';

interface VoteStatusBarProps {
  votesCount: number;
  totalVotes: number;
  shouldShow: boolean;
}

const VoteStatusBar: FC<VoteStatusBarProps> = ({votesCount, totalVotes, shouldShow}) => {
  const [innerVotesCount, setInnerVotesCount] = useState(votesCount);
  const [innerTotalVotes, setInnerTotalVotes] = useState(votesCount);
  const noVotesLeft = useMemo(() => innerVotesCount === innerTotalVotes, [innerVotesCount, innerTotalVotes]);

  useEffect(() => {
    let newVotesCount = votesCount;
    let newTotalVotes = totalVotes;

    if (newVotesCount > newTotalVotes) {
      newVotesCount = totalVotes;
      console.warn('votesCount should be less than or equal to totalVotes');
    }
    if (newVotesCount < 0) {
      newVotesCount = 0;
      console.warn('votesCount should be greater than or equal to 0');
    }
    if (newTotalVotes < 0) {
      newTotalVotes = 0;
      console.warn('totalVotes should be greater than or equal to 0');
    }
    setInnerVotesCount(newVotesCount);
    setInnerTotalVotes(newTotalVotes);
  }, [votesCount, totalVotes]);

  return (
    <StatusBar variant={noVotesLeft ? StatusBarVariant.Muted : StatusBarVariant.Primary} shouldShow={shouldShow}>
      {noVotesLeft ? 'No votes left' : `${innerTotalVotes - innerVotesCount} out of ${innerTotalVotes} votes left`}
    </StatusBar>
  );
};

export default VoteStatusBar;
