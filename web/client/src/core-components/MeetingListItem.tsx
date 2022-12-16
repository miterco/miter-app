import classNames from 'classnames';
import { MeetingWithTokenValue } from 'miter-common/SharedTypes';
import { useRef, useEffect, useMemo, forwardRef } from 'react';
import './MeetingListItem.less';
import { formatDate, getGoalString } from 'miter-common/CommonUtil';

const StatusAnimCycleLength = 1500; // ms

interface MeetingListItemProps {
  meeting: MeetingWithTokenValue;
  isSelected: boolean;
  onSelect: () => void;
}


const MeetingListItem = forwardRef<HTMLDivElement, MeetingListItemProps>(({meeting, onSelect, isSelected}, ref) => {
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimer = useRef<number>(0);

  const timing: 'Past' | 'Current' | 'Future' = useMemo(() => {
    if (!meeting.startDatetime || !meeting.endDatetime) return 'Future';
    const now = new Date().getTime();
    const startNum = meeting.startDatetime.getTime();
    if (startNum > now) return 'Future';
    if (meeting.endDatetime.getTime() > now) return 'Current';

    return 'Past';
  }, [meeting.startDatetime, meeting.endDatetime]);

  useEffect(() => {
    if (timing === 'Current' && !statusTimer.current) {
      statusTimer.current = window.setInterval(() => statusRef.current?.classList.toggle('Lit'), StatusAnimCycleLength);
    } else if (timing !== 'Current' && statusTimer.current) {
      window.clearInterval(statusTimer.current);
      statusTimer.current = 0;
    }
  }, [timing]);

  return (
    <div className={classNames('MeetingListItem', timing, { SelectedMeeting: isSelected })} onClick={onSelect} ref={ref}>
      <div>
        <h4>{meeting.title}</h4>
        <div
          ref={statusRef}
          className={classNames(
            'Status',
            {Warn: !meeting.goal && !meeting.isGoalExempt && timing !== 'Past'},
            {Active: (meeting.goal || meeting.isGoalExempt) && timing === 'Current'})}
        />
        <div className="TS">{formatDate(meeting.startDatetime, {time: true})}</div>
      </div>
      <div>
        <h5 className={classNames({EmptyWarn: !(meeting.goal || meeting.isGoalExempt)})}>{meeting.goal ? getGoalString(meeting.goal) : 'Meeting has no goal'}</h5>
      </div>
    </div>
  );
});


export default MeetingListItem;