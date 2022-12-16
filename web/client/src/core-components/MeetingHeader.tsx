import {useNavigate} from 'react-router-dom';
import bridge from '../Bridge';
import Button, {ButtonType} from '../basic-components/Button';
import './MeetingHeader.less';
import * as Util from '../Utils';
import {MeetingPhase, MeetingWithTokenValue} from 'miter-common/SharedTypes';
import GoalField from './GoalField';
import FacePile from '../basic-components/FacePile';
import ToggleEdit from '../basic-components/ToggleEdit';
import {useMiterContext} from '../model/MiterContextProvider';
import {useZoomContext, ZoomAppContext} from '../model/ZoomContextProvider';
import {editMeetingGoal, editMeetingTitle, fetchPriorMeetings, leaveMeeting} from '../model/MeetingApi';
import {useCallback, useEffect, useMemo, useState} from 'react';
import ActionBar, {BarItem, BarMenuItem} from '../basic-components/ActionBar';

import {CloseIcon, PopOutIcon, InviteIcon, FeedbackIcon, PastTimesIcon, LogoLockupIcon} from 'image';
import SendFeedbackDialog from './SendFeedbackDialog';
import MeetingButtonBar from './MeetingButtonBar';
import {StrMeetingCommands} from 'miter-common/Strings';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';

const makePriorMeetingMenuItem = (meeting: MeetingWithTokenValue): BarMenuItem => {
  if (!meeting.startDatetime) {
    console.warn('Encountered a meeting with neither start time nor end time.');

    return {content: <></>};
  }

  return {
    key: meeting.tokenValue,
    content: (
      <div className="PriorMeetingMenuItem">
        {Util.makeCompoundDateTimeStamp(meeting.startDatetime)}
        <div className="Title">{meeting.title}</div>
      </div>
    ),
  };
};

interface MeetingHeaderProps {
  embedded?: boolean;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = ({embedded}) => {
  const {meeting, participants} = useMiterContext();
  const {isZoomApp, zoomSdkLoaded, zoomContext} = useZoomContext();
  const {showInviteColleaguesModal} = useInviteColleaguesContext();
  const [priorMeetings, setPriorMeetings] = useState<MeetingWithTokenValue[]>([]);
  const phase: MeetingPhase = meeting?.phase || 'NotStarted';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPriorMeetings().then(priorMeetings => setPriorMeetings(priorMeetings));
    setMounted(true);
  }, [meeting]);

  // If no meeting title has been set in the Zoom App, focus the title input and make it editable.
  useEffect(() => {
    if (zoomSdkLoaded && (meeting?.title === '' || meeting?.title === 'Zoom Meeting')) {
      setIsEditingTitle(true);
    }
  }, [mounted, zoomSdkLoaded, meeting?.title]);

  const handleClose = useCallback(() => {
    if (embedded) bridge.sendMessage('HIDE_SIDEBAR', {});
    else {
      leaveMeeting();
      navigate('/app');
    }
  }, [embedded, navigate]);

  const handlePopOut = useCallback(() => {
    const width = 480;
    const left = window.screen.width - width;

    window.open(
      Util.getUrl(),
      `miter_${window.location.pathname}`,
      `location=1,toolbar=1,menubar=1,resizable=1,left=${left},top=${window.screenY},width=${width},height=${window.innerHeight}`
    );
    bridge.sendMessage('HIDE_SIDEBAR', {});
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      const trimmedValue = value.trim();

      if (!isEditingTitle) return;
      if (trimmedValue) editMeetingTitle(trimmedValue);

      setIsEditingTitle(false);
    },
    [isEditingTitle]
  );

  // TODO: modify the BarItem type to take a boolean include parameter and then have ActionBar
  // filter for it. Would simplify the logic here (especially if we end up needing more
  // conditional items over time).
  const priorMeetingItems = useMemo(
    () => priorMeetings.map(meeting => makePriorMeetingMenuItem(meeting)),
    [priorMeetings]
  );

  const actionBarItems = useMemo<BarItem[][]>(() => {
    const leftAlignedItems: BarItem[] = [
      {
        icon: <InviteIcon />,
        label: StrMeetingCommands.Invite,
        description: 'Invite others to use Miter',
        onClick: () => {
          if (!isZoomApp) showInviteColleaguesModal();
          else if (zoomSdkLoaded) window.zoomSdk.callZoomApi('showAppInvitationDialog', {});
        },
        visible: zoomContext !== ZoomAppContext.InMainClient,
      },
      {
        icon: <PastTimesIcon />,
        label: 'Past Times',
        menuItems: priorMeetingItems,
        onClick: key => key && window.open(Util.urlForToken(key)),
        disabled: priorMeetings.length === 0,
        addMenuDividers: true,
        preferCollapseToOverflow: true,
        visible: true,
      },
    ];
    const rightAlignedItems: BarItem[] = [
      {
        icon: <FeedbackIcon />,
        label: 'Feedback',
        description: 'Send product feedback to Miter',
        onClick: () => setShowFeedbackDialog(true),
        preferCollapseToOverflow: true,
        visible: true,
      },
    ];

    return [leftAlignedItems, rightAlignedItems];
  }, [isZoomApp, zoomSdkLoaded, priorMeetings, priorMeetingItems, zoomContext, showInviteColleaguesModal]);

  return (
    <div className="MeetingHeader">
      <div className="Titlebar">
        <div className="TitlebarActions">
          <a href="/app">
            <LogoLockupIcon className="MiterLogo" />
          </a>

          <div className="Toolbar">
            <FacePile people={participants} maxNumber={5} height={24} />
            {embedded && <Button type={ButtonType.borderless} icon={<PopOutIcon />} onClick={handlePopOut} />}
            {(zoomContext === ZoomAppContext.NotInZoom || zoomContext === ZoomAppContext.InMainClient) && (
              <Button type={ButtonType.borderless} title="Close Sidebar" onClick={handleClose} icon={<CloseIcon />} />
            )}
          </div>
        </div>

        <ToggleEdit
          editing={isEditingTitle}
          tagName="h1"
          placeholder="What is this meeting about?"
          value={meeting?.title || (isZoomApp && 'Zoom Meeting') || ''}
          onBlur={handleTitleChange}
          shouldSave={handleTitleChange}
          onCancel={() => setIsEditingTitle(false)}
          onFocus={() => setIsEditingTitle(true)}
        />
      </div>

      {meeting?.startDatetime && <h2 className="Date">{Util.makeCompoundDateTimeStamp(meeting.startDatetime)}</h2>}
      <div className="MeetingBar">
        <GoalField
          goal={meeting?.goal || null}
          onChange={newGoal => editMeetingGoal(newGoal)}
          useStrongNudge={phase === 'InProgress' && !meeting?.isGoalExempt}
        />
        <ActionBar items={actionBarItems} rightAlignLastGroup />
      </div>

      {meeting?.phase !== 'NotStarted' && <MeetingButtonBar />}

      <SendFeedbackDialog open={showFeedbackDialog} shouldClose={() => setShowFeedbackDialog(false)} />
    </div>
  );
};

export default MeetingHeader;
