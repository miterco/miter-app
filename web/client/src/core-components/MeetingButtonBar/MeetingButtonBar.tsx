/*
 * Button bar handles primary meeting navigation across all three meeting phases. It can appear as part of the meeting
 * header, or below the meeting content (compact = true).
 */

import {Dropdown, Menu, MenuItemProps, notification, Popover, Spin} from 'antd';
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import classNames from 'classnames';
import {EmailIcon, InviteIcon, ProtocolsFilledIcon, ShareIcon, PrevMeetingPhaseIcon, NextMeetingPhaseIcon} from 'image';
import {useMiterContext} from 'model/MiterContextProvider';
import {useZoomContext} from 'model/ZoomContextProvider';
import React, {MouseEvent, ReactNode, useCallback, useMemo, useState} from 'react';
import useWidthObserver from 'hooks/useWidthObserver';
import './MeetingButtonBar.less';
import Tooltip from 'basic-components/Tooltip';
import ProtocolPickerModal from 'core-components/Protocols/ProtocolPickerModal';
import {StrMeetingCommands, StrProtocols} from 'miter-common/Strings';
import cn from 'classnames';
import {copyToClipboard, error, showToast, track} from 'Utils';
import SendSummaryDialog from 'core-components/SummaryView/SendSummaryDialog';
import {getSummaryHtml, getSummaryMarkdown} from 'model/SummaryUtil';
import {MeetingPhase} from 'miter-common/SharedTypes';
import {useMiterTour} from 'core-components/MiterTourContextProvider';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';

interface MeetingButtonBarProps {
  compact?: boolean;
  className?: string;
}

interface DetailMenuItemProps extends MenuItemProps {
  name: string;
  description?: string;
}

const DetailMenuItem = (props: DetailMenuItemProps) => {
  const {name, description, ...passedProps} = props;

  return (
    <Menu.Item className="DetailMenuItem" {...passedProps}>
      <div>{name}</div>
      {props.description ? <small>{description}</small> : null}
    </Menu.Item>
  );
};

const NarrowWidth = 402;

const MeetingButtonBar: React.FC<MeetingButtonBarProps> = props => {
  const {width, setRef} = useWidthObserver();
  const {meeting, notes, summaryItems, pendingPhase, handleChangePhaseAction, currentUser} = useMiterContext();
  const {isZoomApp, zoomSdkLoaded} = useZoomContext();
  const {showInviteColleaguesModal} = useInviteColleaguesContext();
  const [isSummarySendConfirmationVisible, setSummarySendConfirmationVisible] = useState(false);
  const {completeTourStep} = useMiterTour();
  const {
    currentProtocol,
    setIsDrawerExpanded,
    showProtocolPickerModal,
    setShowProtocolPickerModal,
    protocols,
    openProtocol,
  } = useProtocolContext();

  const handleChangePhaseClick = useCallback(
    (event: MouseEvent, phase: MeetingPhase) => {
      handleChangePhaseAction(phase, event.altKey);
    },
    [handleChangePhaseAction]
  );

  const handleNextClick = useCallback(
    (event: MouseEvent) => {
      if (meeting?.phase === 'InProgress') {
        handleChangePhaseClick(event, 'Ended');
        const composerInput = document.querySelector('.Composer .ToggleEdit');
        const composerValue = composerInput ? (composerInput as HTMLSpanElement).innerText : null;
        const composerValueLength = typeof composerValue === 'string' ? composerValue.length : -1;
        track('Click Finish', {'Composer Text Length': composerValueLength});
      } else {
        completeTourStep('StartBtn');
        handleChangePhaseClick(event, 'InProgress');
      }
    },
    [completeTourStep, handleChangePhaseClick, meeting?.phase]
  );

  const handleBackClick = useCallback(
    (event: MouseEvent) => {
      handleChangePhaseClick(event, meeting?.phase === 'InProgress' ? 'NotStarted' : 'InProgress');
    },
    [handleChangePhaseClick, meeting?.phase]
  );

  const handleSummarySendClick = useCallback(() => {
    if (summaryItems?.length || notes?.length) setSummarySendConfirmationVisible(true);
    else {
      showToast("There's nothing in your summary to send! Try adding a decision, action item, or starred note.");
    }
  }, [summaryItems?.length, notes?.length]);

  const handleProtocolBtn = useCallback(() => {
    completeTourStep('Protocols');
    if (currentProtocol) setIsDrawerExpanded(true);
    else if (meeting?.currentProtocolId) {
      openProtocol(meeting?.currentProtocolId);
    } else setShowProtocolPickerModal(true);
  }, [
    completeTourStep,
    setIsDrawerExpanded,
    setShowProtocolPickerModal,
    meeting?.currentProtocolId,
    currentProtocol,
    openProtocol,
  ]);

  const handleShareSelect = useCallback(
    (key: string) => {
      switch (key) {
        case 'markdown': {
          const textToCopy = getSummaryMarkdown(meeting, summaryItems, protocols);
          if (textToCopy) {
            copyToClipboard(textToCopy, false, {
              nounForTitle: 'Summary',
              description: 'Paste into Notion, Slack, or your favorite editor.',
            });
          } else {
            console.error('Unable to copy summary markdown. Please try again in a moment.');
          }
          break;
        }

        case 'html': {
          const html = getSummaryHtml(meeting, summaryItems, protocols);
          if (html) {
            copyToClipboard(html, true, {
              nounForTitle: 'Summary',
              description: 'Paste into GDocs, Word, or your favorite notes app.',
            });
          } else {
            error('Unable to copy summary HTML. Please try again in a moment.');
          }
          break;
        }
      }
    },
    [meeting, protocols, summaryItems]
  );

  const nextBtn = useMemo(() => {
    if (!meeting) return undefined;

    if (meeting.phase === 'Ended') {
      return (
        <React.Fragment key="nextBtn">
          <Button
            className="NextBtn SendBtn"
            onClick={handleSummarySendClick}
            size={ButtonSize.large}
            type={ButtonType.primary}
            icon={<EmailIcon />}
            isShrinkable
          >
            {StrMeetingCommands.SendSummary}
          </Button>

          {/*
            Every time the SummarySendDialog is hidden, it is removed from the DOM.
            The next time it will be mounted again so the list of possible recipients will be updated.
        */}
          {isSummarySendConfirmationVisible && (
            <SendSummaryDialog open shouldClose={() => setSummarySendConfirmationVisible(false)} />
          )}
        </React.Fragment>
      );
    } else {
      return (
        <Tooltip
          key="nextBtn"
          content={meeting.phase === 'InProgress' ? StrMeetingCommands.End : StrMeetingCommands.Start}
        >
          <Button
            className={cn('NextBtn', {
              FinishBtn: meeting.phase === 'InProgress',
              StartBtn: meeting.phase !== 'InProgress',
              Pulse: meeting.phase === 'NotStarted',
            })}
            onClick={handleNextClick}
            size={ButtonSize.large}
            type={meeting.phase === 'NotStarted' ? ButtonType.primary : undefined}
            icon={pendingPhase?.phase ? <Spin size="small" /> : <NextMeetingPhaseIcon />}
            disabled={Boolean(pendingPhase)}
            isShrinkable
            data-tour={meeting.phase === 'NotStarted' && 'StartBtn'}
          >
            {meeting.phase === 'InProgress' ? StrMeetingCommands.End : StrMeetingCommands.Start}
          </Button>
        </Tooltip>
      );
    }
  }, [handleNextClick, handleSummarySendClick, isSummarySendConfirmationVisible, meeting, pendingPhase]);

  const shareBtn = useMemo(() => {
    if (meeting?.phase !== 'Ended') return undefined;
    const shareMenu = (
      <Menu onClick={info => handleShareSelect(info.key)}>
        <DetailMenuItem key="html" name="Copy HTML" description="Use for Google Docs or Word." />
        <DetailMenuItem key="markdown" name="Copy Markdown" description="Use for Notion, Slack, or plain text." />
      </Menu>
    );
    return (
      <Dropdown key="shareBtn" overlay={shareMenu} trigger={['click']}>
        <Button className="ShareBtn" size={ButtonSize.large} icon={<ShareIcon />} />
      </Dropdown>
    );
  }, [handleShareSelect, meeting?.phase]);

  const protocolsBtn = useMemo(() => {
    if (meeting?.phase !== 'InProgress') return null;

    const btn = (
      <Button
        className="ProtocolsBtn"
        onClick={currentUser ? handleProtocolBtn : undefined}
        size={ButtonSize.large}
        icon={<ProtocolsFilledIcon className="Icon" />}
        title={StrProtocols.ProtocolsTooltip}
        type={ButtonType.primary}
        data-tour="Protocols"
      >
        {StrProtocols.Protocols}
      </Button>
    );

    return (
      <React.Fragment key="protocolsBtn">
        {currentUser ? btn : <SignInPopover>{btn}</SignInPopover>}
        <ProtocolPickerModal open={showProtocolPickerModal} onClose={() => setShowProtocolPickerModal(false)} />
      </React.Fragment>
    );
  }, [currentUser, handleProtocolBtn, meeting?.phase, setShowProtocolPickerModal, showProtocolPickerModal]);

  const content = useMemo(() => {
    if (!meeting?.phase) return null;

    const backBtn = meeting.phase !== 'NotStarted' && (
      <Button
        key="backBtn"
        className={meeting.phase === 'InProgress' ? 'UnstartBtn' : 'BackBtn'}
        onClick={handleBackClick}
        size={ButtonSize.large}
        icon={pendingPhase?.phase === 'NotStarted' ? <Spin size="small" /> : <PrevMeetingPhaseIcon />}
        disabled={Boolean(pendingPhase)}
      />
    );

    const inviteBtn = meeting.phase === 'NotStarted' && (
      <Button
        key="inviteBtn"
        className="InviteBtn"
        onClick={() => {
          if (!isZoomApp) showInviteColleaguesModal();
          else if (zoomSdkLoaded) window.zoomSdk.callZoomApi('showAppInvitationDialog', {});
        }}
        icon={<InviteIcon />}
        size={ButtonSize.large}
      >
        {StrMeetingCommands.Invite}
      </Button>
    );

    return [backBtn, inviteBtn, protocolsBtn, shareBtn, nextBtn];
  }, [
    meeting?.phase,
    handleBackClick,
    pendingPhase,
    isZoomApp,
    protocolsBtn,
    shareBtn,
    nextBtn,
    zoomSdkLoaded,
    showInviteColleaguesModal,
  ]);

  return (
    <div
      ref={setRef}
      className={classNames('MeetingButtonBar', {Compact: props.compact, Narrow: width < NarrowWidth}, props.className)}
    >
      {content}
    </div>
  );
};

// Making this its own component because it needs to handle state. Making it an internal component because we're not
// using it anywhere else, at least not yet.
const SignInPopover: React.FC<{children: ReactNode}> = ({children}) => {
  const {setShowSignInDialog} = useMiterContext();
  const [visible, setVisible] = useState(false);
  const {completeTourStep} = useMiterTour();

  const handleBtnClick = useCallback(() => {
    setShowSignInDialog(true);
    setVisible(false);
  }, [setShowSignInDialog]);

  const handleVisibleChange = useCallback(
    (newVal: boolean) => {
      setVisible(newVal);
      completeTourStep('Protocols');
    },
    [completeTourStep]
  );

  return (
    <Popover
      open={visible}
      onOpenChange={handleVisibleChange}
      trigger="click"
      content={
        <div className="SignInPopoverContent">
          <h3>{StrProtocols.ProtocolsSignInPrompt.Title}</h3>
          <p>{StrProtocols.ProtocolsSignInPrompt.Body}</p>
          <Button type={ButtonType.primary} onClick={handleBtnClick}>
            Sign Up / Sign In
          </Button>
        </div>
      }
    >
      {children}
    </Popover>
  );
};

export default MeetingButtonBar;
