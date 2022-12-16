import React, {useEffect, useState, useMemo} from 'react';
import classNames from 'classnames';

// Components.
import {Modal} from 'antd';
import MeetingList from './MeetingList';

// Assets.
import {ReactComponent as RightArrow} from '../image/arrow-right.svg';
import './ZoomMeetingSelector.less';
import {useMeetingListContext} from '../model/MeetingListContextProvider';
import Button, {ButtonSize, ButtonType, ButtonVariant} from 'basic-components/Button';

interface ZoomMeetingSelectorProps {
  onSelect?: (meetingId: string) => any;
}

const ZoomMeetingSelector: React.FC<ZoomMeetingSelectorProps> = ({onSelect = () => {}}) => {
  const {meetingList, loadMeetingList} = useMeetingListContext();
  const [selectedMeetingId, setSelectedMeetingId] = useState('');

  const meetings = useMemo(() => {
    if (meetingList === null) return [];

    // Meetings in the time range below will be shown in the Zoom meeting selector.
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const endOfDay = new Date();
    endOfDay.setHours(23);
    endOfDay.setMinutes(59);
    endOfDay.setSeconds(59);

    const filteredMeetings = meetingList.filter(m => {
      if (!m || !m.startDatetime) return false;
      return m.startDatetime >= oneHourAgo && m.startDatetime <= endOfDay;
    });

    if (filteredMeetings.length === 0) {
      // There are no meetings. No need to show the meeting selector.
      onSelect('new');
    }

    return filteredMeetings;
  }, [meetingList, onSelect]);

  useEffect(() => {
    loadMeetingList('ZoomMeetingSelector');
  }, [loadMeetingList]);

  const footer = (
    <div className="ZoomMeetingSelectorFooter">
      <Button
        disabled={!selectedMeetingId}
        type={ButtonType.primary}
        size={ButtonSize.large}
        variant={ButtonVariant.outline}
        className="ContinueButton"
        onClick={() => onSelect(selectedMeetingId)}
      >
        Continue
      </Button>
    </div>
  );

  return meetingList?.length ? (
    <Modal className="ZoomMeetingSelector" footer={footer} title="Which meeting is this?" visible mask={false}>
      <p>We found multiple meetings in your calendar today that might be this one. Which do you want to use?</p>

      <div className="MeetingList">
        <div
          className={classNames('CreateMeetingButton', {Selected: selectedMeetingId === 'new'})}
          onClick={() => setSelectedMeetingId('new')}
        >
          <h4>Create New Meeting</h4>

          <RightArrow />
        </div>
        <MeetingList
          meetings={meetings}
          selectedId={selectedMeetingId}
          onSelect={meetingId => setSelectedMeetingId(meetingId)}
        />
      </div>
    </Modal>
  ) : (
    <></>
  );
};

export default ZoomMeetingSelector;
