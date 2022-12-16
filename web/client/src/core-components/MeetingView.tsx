import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import NoteList from 'core-components/Notes/NoteList';
import './MeetingView.less';
import MeetingHeader from './MeetingHeader';
import SummaryView from './SummaryView';
import Card from './Card';
import StartView from './StartView';
import * as Util from '../Utils';
import {useZoomContext, ZoomAppContext} from '../model/ZoomContextProvider';
import {useMiterContext} from '../model/MiterContextProvider';
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import TopicBar from './TopicBar';
import {cancelChangeMeetingPhase, editMeetingTitle, joinMeeting} from '../model/MeetingApi';
import * as ZoomApi from '../model/ZoomApi';
import {StrPhaseChangeDescriptions} from 'miter-common/Strings';
import {toast} from 'react-toastify';
import {Spin} from 'antd';
import ZoomMeetingSelector from './ZoomMeetingSelector';
import classNames from 'classnames';
import ProtocolContextProvider from 'model/ProtocolContextProvider';
import {fetchMeetingProtocols, fetchProtocolTypes} from 'model/ProtocolApi';
import {useMiterTour} from './MiterTourContextProvider';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';
import {Seconds} from 'miter-common/CommonUtil';

interface MeetingViewProps {
  embedded?: boolean;
  meetingExternalIdentifier: string;
}

export const MeetingView: React.FC<MeetingViewProps> = props => {
  const {meeting, meetingError, pendingPhase, participants, hidePromoBar} = useMiterContext();
  const {zoomContext} = useZoomContext();
  const {openTour} = useMiterTour();
  const phase = meeting?.phase;
  const phaseChangeToastId = useRef<string | number | null>(null);
  const [shouldShowMeetingSelector, setShouldShowMeetingSelector] = useState(false);
  const lastMeetingExternalIdRef = useRef<string | number | null>(null);

  // When the view first loads, or we change phase, open the tour if it's incomplete.
  useEffect(() => openTour(), [openTour, phase]);

  // ===================================================================================================================
  //                                     JOIN THE MEETING WHEN THE TOKEN CHANGES
  // ===================================================================================================================
  const handleJoinMeeting = useCallback(async () => {
    const meetingExternalId = props.meetingExternalIdentifier;

    // Avoid loading a meeting that is already loaded. This prevents refreshing the MeetingNav twice.
    if (lastMeetingExternalIdRef.current === meetingExternalId) return;

    // Avoid trying to load a meeting before the Zoom SDK has been initialized.
    if (zoomContext === ZoomAppContext.Pending) return;

    // Set the current meeting as the last loaded meeting.
    lastMeetingExternalIdRef.current = meetingExternalId;

    switch (zoomContext) {
      case ZoomAppContext.NotInZoom:
        return joinMeeting(meetingExternalId);

      case ZoomAppContext.InMainClient:
        if (meetingExternalId === 'zoom') window.location.href = '/app?isZoomApp=true';
        else joinMeeting(meetingExternalId);
        break;

      default: {
        // In a meeting or a webinar.
        let meetingID: string | null = null;

        try {
          ({meetingID} = await window.zoomSdk.getMeetingContext());
        } catch (_error) {}

        const meetingToken = await ZoomApi.fetchMeetingTokenForZoomMeeting(meetingID);
        if (meetingToken) joinMeeting(meetingToken);
        else setShouldShowMeetingSelector(true);
      }
    }
  }, [props.meetingExternalIdentifier, zoomContext]);

  useEffect(() => {
    handleJoinMeeting();
  }, [handleJoinMeeting]);

  // ===================================================================================================================
  //                                            UPDATE THE DOCUMENT TITLE
  // ===================================================================================================================
  useEffect(() => {
    // When the meeting changes, fetch all protocols for the current meeting.
    if (meeting) {
      fetchProtocolTypes().then(() => {
        fetchMeetingProtocols();
      });
    }

    // Set the page title automatically when joining a meeting.
    document.title = meeting?.title ? `${meeting.title} - Miter` : 'Miter';

    return () => {
      document.title = 'Miter'; // Restore the app title when closing the meeting.
    };
  }, [meeting]);

  // ===================================================================================================================
  //                                     AUTOMATICALLY SET THE ZOOM MEETING TITLE
  // ===================================================================================================================
  // When using the Zoom App, use the Zoom Meeting topic as the default title if the user hasn't set one.
  useEffect(() => {
    if (zoomContext === ZoomAppContext.InMeeting && meeting?.title === '') {
      window.zoomSdk.getMeetingContext().then((context: any) => editMeetingTitle(context.meetingTopic));
    }
  }, [meeting?.title, zoomContext]);

  // ===================================================================================================================
  //                                            ZOOM MEETING CORRELATION
  // ===================================================================================================================
  const onMeetingSelected = useCallback(async (meetingToken: string) => {
    let zoomMeetingNID = null;

    try {
      zoomMeetingNID = (await window.zoomSdk.getMeetingContext()).meetingID;
    } catch (error) {
      console.log('Failed to read the meeting numeric ID: ${error}');
    }

    try {
      if (meetingToken === 'new') {
        const meetingToken = await ZoomApi.createMeeting(zoomMeetingNID);
        if (meetingToken) joinMeeting(meetingToken);
        else alert('Failed to create a new Miter meeting');
      } else if (await ZoomApi.correlateMeetings(meetingToken, zoomMeetingNID)) {
        joinMeeting(meetingToken);
      }
    } catch (error) {
      // If it failed, it most probably is because someone else in the meeting already correlated the current Zoom
      // meeting to a Miter meeting. Trying to correlate this meeting to another Miter meeting violates the unique
      // constraint in the database. When this happens, the page is reloaded so that the user is automatically
      // redirected to the right meeting.
      window.location.reload();
    }
  }, []);

  // ===================================================================================================================
  //                                                  PHASE CHANGE
  // ===================================================================================================================
  const phaseChangeToastContent = useMemo(() => {
    if (!pendingPhase) return null;
    return (
      <div className="PhaseChangeToastContent">
        <div>{StrPhaseChangeDescriptions[phase ? `${phase}_${pendingPhase.phase}` : 'unknown']}</div>
        <Button
          type={ButtonType.borderless}
          size={ButtonSize.small}
          className="OnDark"
          onClick={cancelChangeMeetingPhase}
        >
          Cancel
        </Button>
      </div>
    );
  }, [pendingPhase, phase]);

  useEffect(() => {
    if (phaseChangeToastId.current) {
      toast.dismiss(phaseChangeToastId.current);
      phaseChangeToastId.current = null;
    }
    if (pendingPhase && pendingPhase?.changeTime !== 'Waiting') {
      phaseChangeToastId.current = toast(phaseChangeToastContent, {
        autoClose: pendingPhase.changeTime - Date.now() - 250,
        closeButton: false,
      });
    }
    // Next line disabled because we don't want phase as a dependency.
  }, [pendingPhase]); // eslint-disable-line

  const getPaneContent = useCallback(() => {
    if (phase) {
      switch (phase) {
        case 'NotStarted':
          return <StartView />;

        case 'InProgress':
          return (
            <div className="MeetingContent">
              <Card className="NoteListContainer" listCard customHeader={<TopicBar />}>
                <NoteList />
              </Card>
            </div>
          );

        case 'Ended':
          return <SummaryView />;

        default:
          Util.error(`MeetingView received an unknown meeting status of ${phase}.`);

          return <p>An error occurred.</p>;
      }
    } else {
      console.error('Tried to get MeetingView pane content without a meeting.');
    }
  }, [phase]);

  if (meeting) {
    return (
      <ProtocolContextProvider>
        <main className={classNames('MeetingView', 'RootCard', `MeetingPhase${phase}`)}>
          <MeetingHeader embedded={props.embedded} />
          {getPaneContent()}
        </main>
      </ProtocolContextProvider>
    );
  } else if (shouldShowMeetingSelector) {
    return <ZoomMeetingSelector onSelect={onMeetingSelected} />;
  } else {
    const message = meetingError ? (
      <>
        <h2>Error Loading Miter</h2>
        <p>{meetingError}</p>
      </>
    ) : (
      <div className="LoadingIndicator">
        <Spin />
        Loading Miter...
      </div>
    );

    return <main className={classNames('MeetingView', 'RootCard', 'Loading', {Error: !meeting})}>{message}</main>;
  }
};

export default MeetingView;
