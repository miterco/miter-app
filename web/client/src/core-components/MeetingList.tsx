import {ReactNode, useMemo, useEffect, useRef} from 'react';
import classNames from 'classnames';
import {MeetingWithTokenValue} from 'miter-common/SharedTypes';

import {Empty} from 'antd';
import StickyHeader from '../basic-components/StickyHeader';
import MeetingListItem from './MeetingListItem';
import {formatDate} from 'miter-common/CommonUtil';

interface MeetingListProps {
  meetings: MeetingWithTokenValue[] | null;
  selectedId?: string;
  groupByDate?: boolean;
  emptyMessage?: string;

  // Event handlers.
  onStickHeader?: (element: Element) => void;
  onUnstickHeader?: (element: Element) => void;
  onSelect: (meetingToken: string) => any;
}

const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  selectedId = undefined,
  groupByDate = false,
  emptyMessage,
  onSelect,
  onStickHeader,
  onUnstickHeader,
}) => {
  const nextMeetingRef = useRef<HTMLDivElement>(null); // Nearest meeting in the future.
  const alreadyScrolledToNowRef = useRef(false); // Whether we already automatically scrolled to the next meeting.
  const meetingListElementRef = useRef<HTMLDivElement>(null); // The element that wraps all the MeetingItems.

  // Automatically scroll the list to this moment.
  useEffect(() => {
    if (!alreadyScrolledToNowRef.current && meetings && nextMeetingRef.current && meetingListElementRef.current) {
      // Rough approximation of centering the scroll position on now. Will refine later.
      const nextMeetingCenterY = nextMeetingRef.current.offsetTop + nextMeetingRef.current.offsetHeight / 2;
      const listHeight = meetingListElementRef.current.offsetHeight;
      meetingListElementRef.current.scrollTop = nextMeetingCenterY - listHeight / 2;
      alreadyScrolledToNowRef.current = true;
    }
  }, [meetings]);

  const meetingItems = useMemo(() => {
    if (!meetings) return [];

    const listItems: ReactNode[] = [];
    const now = new Date();
    const today = formatDate(now, {day: true, date: true});
    let previousMeetingDay = '';

    meetings.forEach((meeting, i) => {
      if (!meeting.startDatetime) return console.warn('Received a meeting without a start time');

      const isNextMeeting = !nextMeetingRef.current && meeting.startDatetime < now;
 
      if (groupByDate && onStickHeader && onUnstickHeader) {
        // If groupByDate is enabled, group the meeting items by date and add a header with the name of the day.
        const meetingDay = formatDate(meeting.startDatetime, {day: true, date: true});

        if (meetingDay !== previousMeetingDay) {
          previousMeetingDay = meetingDay;
          listItems.push(
            <StickyHeader key={`header_${previousMeetingDay}`} onStick={onStickHeader} onUnstick={onUnstickHeader}>
              {previousMeetingDay === today ? 'Today' : previousMeetingDay}
            </StickyHeader>
          );
        }
      }

      listItems.push(
        <MeetingListItem
          ref={isNextMeeting ? nextMeetingRef : undefined}
          key={i}
          meeting={meeting}
          isSelected={meeting.tokenValue === selectedId}
          onSelect={() => onSelect(meeting.tokenValue)}
        />
      );
    });

    return listItems;
  }, [meetings, groupByDate, selectedId, onUnstickHeader, onStickHeader, onSelect]);

  const noItems = emptyMessage && (
    <Empty className="Empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyMessage} />
  );

  return (
    <div ref={meetingListElementRef} className={classNames('CardList', {NoContent: !meetings?.length})}>
      {meetings?.length ? meetingItems : noItems}
    </div>
  );
};

export default MeetingList;
