// Vendor
import {FC, useMemo} from 'react';

// Components
import {CheckedIcon, TypingIcon, WaitingIcon} from 'image';

// Styles
import './ProtocolActivityIndicator.less';
import cn from 'classnames';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {useMiterContext} from 'model/MiterContextProvider';

interface ProtocolActivityIndicatorProps {}

const ProtocolActivityIndicator: FC<ProtocolActivityIndicatorProps> = () => {
  const {isEveryoneDone, isSoloStateCompleted, userActivityCount, currentProtocol, busyUsersCount} =
    useProtocolContext();
  const {meeting} = useMiterContext();

  const content = useMemo(() => {
    const isCollectivePhase = currentProtocol?.currentPhase?.isCollective;

    // There's no concept of a per-protocol activity indicator. Right now the activity indicator shows the activity of
    // the current meeting protocol activity. Therefore, it doesn't make sense to show the user activity of the current
    // meeting protocol when another protocol is open.
    if (currentProtocol?.id !== meeting?.currentProtocolId) return null;

    if (userActivityCount > 0) {
      // There's activity. Show the activity indicator message.
      return (
        <>
          <TypingIcon /> {userActivityCount}
          {userActivityCount === 1 ? ' person' : ' people'} {currentProtocol?.currentPhase?.data.userActivityLabel}
        </>
      );
    }

    if (!isCollectivePhase) {
      if (isEveryoneDone && currentProtocol?.readyForNextPhase) {
        // Phase is completed.
        return (
          <>
            <CheckedIcon /> All done
          </>
        );
      } else if (isSoloStateCompleted) {
        return (
          <>
            <WaitingIcon />
            Waiting for {busyUsersCount} {busyUsersCount === 1 ? 'other' : 'others'}
          </>
        );
      }
    }
  }, [
    userActivityCount,
    isEveryoneDone,
    isSoloStateCompleted,
    currentProtocol,
    meeting?.currentProtocolId,
    busyUsersCount,
  ]);

  return (
    <div
      className={cn('ProtocolActivityIndicator', {
        Done: userActivityCount === 0 && isEveryoneDone && currentProtocol?.readyForNextPhase,
        WaitingForOthers: userActivityCount === 0 && isSoloStateCompleted && !isEveryoneDone,
      })}
    >
      {content}
    </div>
  );
};

export default ProtocolActivityIndicator;
