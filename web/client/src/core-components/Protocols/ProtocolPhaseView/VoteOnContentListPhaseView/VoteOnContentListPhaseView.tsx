import VoteStatusBar from 'basic-components/StatusBar/VoteStatusBar';
import ProtocolCard, {ProtocolCardMode} from 'core-components/Protocols/ProtocolCard';
import ProtocolDrawerFooter from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerFooter';
import {ProtocolItem, ProtocolPhaseType} from 'miter-common/SharedTypes';
import {useMiterContext} from 'model/MiterContextProvider';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {createProtocolItemAction, deleteProtocolItemAction} from 'model/ProtocolApi';
import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ProtocolPhaseViewProps} from '../ProtocolPhaseView.types';
import {ProtocolItemAction, ProtocolItemActionType} from 'miter-common/SharedTypes';
import {motion, useAnimation} from 'framer-motion';

interface ExtendedProtocolItem extends ProtocolItem {
  isVoted: boolean;
}

const VoteOnContentListPhaseView: FC<ProtocolPhaseViewProps> = ({nextPhase, moveToNextPhase}) => {
  const {currentProtocol} = useProtocolContext();
  const {currentUser} = useMiterContext();
  const controls = useAnimation();
  const isFirstLoadRef = useRef(true);
  const isVotingDisabled = useRef(false);

  const items = useMemo(() => {
    const extendedItems: ExtendedProtocolItem[] = [];

    if (currentProtocol?.items) {
      for (const item of currentProtocol.items) {
        extendedItems.push({
          ...item,
          isVoted:
            item.actions?.some(
              action => action.type === ProtocolItemActionType.Vote && action.creatorId === currentUser?.userId
            ) || false,
        });
      }
    }

    return extendedItems;
  }, [currentProtocol?.items, currentUser?.userId]);

  // Keep a local count of used votes because relying on the item actions data coming from the server would mean that
  // there's a short amount of time when you already voted, but the updated actions data hasn't arrived so you could
  // keep voting even if you run out of votes.
  const usedVotesCount = useMemo(() => {
    return items.reduce((count, {isVoted}) => count + (isVoted ? 1 : 0), 0);
  }, [items]);
  const perUserVotesCount = useMemo(
    () => Math.ceil((currentProtocol?.items?.length ?? 0) / 3),
    [currentProtocol?.items]
  );
  const hasRemainingVotes = useMemo(() => perUserVotesCount > usedVotesCount, [perUserVotesCount, usedVotesCount]);

  const pulseVoteStatusBar = useCallback(() => {
    controls.start({
      scale: [null, 1.2, 1],
      translateY: [null, -2, 1],
      transition: {
        ease: 'easeInOut',
        duration: 0.3,
      },
    });
  }, [controls]);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
    } else {
      pulseVoteStatusBar();
    }
  }, [usedVotesCount, pulseVoteStatusBar]);

  const toggleVote = useCallback(
    async item => {
      // Disable voting until the update protocol items data arrives. Since the protocol items data is used to calculate
      // the number of used votes, not disabling the voting before the data arrives could lead to users using more votes
      // than they should.
      if (isVotingDisabled.current) return;
      else isVotingDisabled.current = true;

      // If the user tries to vote an item that hasn't been voted and
      // has no remaining votes trigger a pulse on the status bar
      if (!item.isVoted && !hasRemainingVotes) {
        pulseVoteStatusBar();
      }
      // Unauthenticated users aren't allowed to vote.
      if (!currentUser?.userId) return;

      if (item.isVoted) {
        // Already voted, remove vote.
        const vote = item.actions.find(
          (action: ProtocolItemAction) =>
            action.type === ProtocolItemActionType.Vote && action.creatorId === currentUser?.userId
        );
        if (vote) {
          await deleteProtocolItemAction(vote.id);
        }
      } else if (usedVotesCount < perUserVotesCount) {
        // Not voted yet, add vote.
        await createProtocolItemAction(item.id, ProtocolItemActionType.Vote);
      }

      isVotingDisabled.current = false;
    },
    [usedVotesCount, perUserVotesCount, currentUser?.userId, hasRemainingVotes, pulseVoteStatusBar]
  );

  return (
    <>
      <div className="ProtocolDrawerBody">
        {items.map(item => (
          <ProtocolCard
            key={item.id}
            onVote={() => toggleVote(item)}
            text={item.text}
            mode={ProtocolCardMode.Vote}
            isChecked={item.isVoted}
            interactionDisabled={!item.isVoted && !hasRemainingVotes}
          />
        ))}
      </div>

      <ProtocolDrawerFooter
        button={{
          disabled: !currentProtocol?.readyForNextPhase || false,
          label: nextPhase?.name || 'Close',
          hasIcon: Boolean(nextPhase),
          onClick: moveToNextPhase,
        }}
        topElement={
          <motion.div initial={false} animate={controls}>
            <VoteStatusBar
              votesCount={usedVotesCount}
              totalVotes={perUserVotesCount}
              shouldShow={currentProtocol?.currentPhase?.type === ProtocolPhaseType.VoteOnContentList}
            />
          </motion.div>
        }
      />
    </>
  );
};

export default VoteOnContentListPhaseView;
