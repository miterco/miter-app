// Hooks.
import {useMemo, useCallback, useEffect, useRef, useState} from 'react';
import {useMiterContext} from '../model/MiterContextProvider';
import {useZoomContext, ZoomAppContext} from '../model/ZoomContextProvider';
import {detect} from 'detect-browser';

// Components.
import Avatar from '../basic-components/Avatar';
import Button, {ButtonType, ButtonVariant} from '../basic-components/Button';
import PromoBar, {Promo} from '../basic-components/PromoBar';

// API.
import {createMagicLink} from '../model/MagicLinkApi';

// Assets.
import {CalendarIcon, LogoLockupIcon, InviteIcon, VideoconferenceIcon, WarningIcon} from 'image';
import './AppHeader.less';

import {getUserPreference, setUserPreference} from 'model/UserPrefs';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';
import {Modal} from 'antd';
import {Shutdown} from 'miter-common/Strings';

type PromoType = 'WebFromZoom' | 'ChromeFromWeb' | 'ZoomFromWeb';
const PromoDismissLimit = 2; // Number of times a user can dismiss a particular promo bar variation before we stop showing it
const Browser = detect();
const startZoomInstall = () => window.open('https://miter.co/install?dest=ZoomApp&utm_source=MiterPromoBar', '_blank');
const startChromeInstall = () =>
  window.open('https://miter.co/install?dest=ChromeExtension&utm_source=MiterPromoBar', '_blank');

const incrementPromoDismissCount = (key: PromoType) => {
  const oldVal = getUserPreference('PromoDismissCounts');
  oldVal[key] = (oldVal[key] || 0) + 1;
  setUserPreference('PromoDismissCounts', oldVal);
};

/*
 * Has a particular promo bar variation been dismissed few enough times that we're still willing to show it?
 */
const isPromoDisplayEligible = (key: PromoType) => {
  const counts = getUserPreference('PromoDismissCounts');
  return (counts[key] || 0) < PromoDismissLimit;
};

const AppHeader: React.FC = () => {
  const {zoomContext} = useZoomContext();
  const {currentUser, meeting, linkedServices, setShowSignInDialog, isInSidebar, showPromo, wipFeature} =
    useMiterContext();
  const {nonUserInvitees, showInviteColleaguesModal} = useInviteColleaguesContext();
  const [didShowInviteModalInMeeting, setDidShowInviteModalInMeeting] = useState<Record<string, boolean>>({});
  const userAvatar = useMemo(() => <Avatar user={currentUser || undefined} size={32} />, [currentUser]);

  // ===================================================================================================================
  //                                                    SIGN IN
  // ===================================================================================================================

  const startGoogleSignInFlow = useCallback(async () => {
    if (zoomContext === ZoomAppContext.NotInZoom) setShowSignInDialog(true);
    else if (zoomContext === ZoomAppContext.InMainClient) {
      const magicLink = await createMagicLink();
      const nextUrl = encodeURIComponent(`https://${document.location.hostname}/sign-in?isZoomApp=true`);
      window.zoomSdk.openUrl({url: `${magicLink}?next=${nextUrl}`});
    }
  }, [zoomContext, setShowSignInDialog]);

  const signInBtn = useMemo(
    () => (
      <Button
        type={ButtonType.default}
        variant={ButtonVariant.outline}
        className="OnDark"
        onClick={startGoogleSignInFlow}
      >
        Sign Up / Sign In
      </Button>
    ),
    [startGoogleSignInFlow]
  );

  useEffect(() => {
    if (!currentUser) {
      const query = new URLSearchParams(window.location.search);
      if (query.get('showSignIn') === 'true') setShowSignInDialog(true);
    }
  }, [currentUser, setShowSignInDialog]);

  // ===================================================================================================================
  //                                                  PROMO BAR
  // ===================================================================================================================

  const handleShutdownLearnMore = useCallback(() => {
    if (window.zoomSdk) {
      window.zoomSdk.openUrl({url: Shutdown.ActionUrl});
    } else {
      window.open(Shutdown.ActionUrl, 'miterShutdownNotice');
    }
  }, []);

  useEffect(() => {
    const PromoBars: Record<string, Promo> = {
      Google: {
        id: 'Google',
        icon: <CalendarIcon />,
        content: 'See all your meetings on this screen:',
        buttonLabel: 'Connect Google Calendar',
        onClick: startGoogleSignInFlow,
        onClose: () => incrementPromoDismissCount('WebFromZoom'),
        hideInSidebar: true,
        showOncePerSession: true,
      },
      Zoom: {
        id: 'Zoom',
        icon: <VideoconferenceIcon />,
        content: 'Get Miter in your Zoom meetings:',
        buttonLabel: 'Install for Zoom',
        onClick: startZoomInstall,
        onClose: () => incrementPromoDismissCount('ZoomFromWeb'),
        hideInSidebar: true,
        showOncePerSession: true,
      },
      ChromeExtension: {
        id: 'ChromeExtension',
        icon: <CalendarIcon />,
        content: 'Use Miter in Google Calendar:',
        buttonLabel: 'Install for Chrome',
        onClick: startChromeInstall,
        onClose: () => incrementPromoDismissCount('ChromeFromWeb'),
        hideInSidebar: true,
        showOncePerSession: true,
      },
      InviteColleagues: {
        id: 'InviteColleagues',
        icon: <InviteIcon />,
        content:
          nonUserInvitees.length === 1
            ? "One invitee doesn't have Miter — invite them!"
            : `${nonUserInvitees.length} invitees don't have Miter — invite them!`,
        buttonLabel: 'Invite Colleagues',
        closeOnMeetingChange: true,
        onClick: () => {
          // Flag the promo as already shown for the current meeting in this session.
          if (meeting) setDidShowInviteModalInMeeting(state => ({...state, [meeting.id]: true}));
          showInviteColleaguesModal();
        },
        onClose: () => {
          // Don't show the Invite Colleagues promo again for the same meeting during this session.
          if (meeting) setDidShowInviteModalInMeeting(state => ({...state, [meeting.id]: true}));
        },
      },
      Shutdown: {
        id: 'Shutdown',
        icon: <WarningIcon />,
        content: Shutdown.LongTitle,
        buttonLabel: Shutdown.ActionLabel,
        closeOnMeetingChange: false,
        onClick: handleShutdownLearnMore,
      },
    };

    // Note that the browser check also excludes in-Zoom, which is what we want
    const chromeExtensionEligible =
      !linkedServices?.ChromeExtension &&
      (Browser?.name === 'chrome' || Browser?.name === 'edge-chromium') &&
      isPromoDisplayEligible('ChromeFromWeb');
    const zoomEligible = !linkedServices?.Zoom && isPromoDisplayEligible('ZoomFromWeb');

    if (wipFeature && wipFeature.indexOf('shutdown') !== -1) {
      showPromo(PromoBars.Shutdown);
    } else if (currentUser && meeting && nonUserInvitees.length && !didShowInviteModalInMeeting[meeting.id]) {
      // Show the promo bar to invite colleagues if the user is logged in, in a meeting and there is someone to invite.
      showPromo(PromoBars.InviteColleagues);
    } else if (linkedServices?.Zoom && !linkedServices?.Google && isPromoDisplayEligible('WebFromZoom')) {
      // Promo Google if we're inside the Zoom main window and haven't connected Google.
      showPromo(PromoBars.Google);
    } else if (!linkedServices?.Google) {
      // If we haven't authed with Google yet (like, not signed in / passwordless) or we're in Zoom, don't worry about other services
    } else if (chromeExtensionEligible || zoomEligible) {
      // Promo the Chrome extension / Zoom app in the web app.
      const randomPromo = Math.random() < 0.5 ? 'Zoom' : 'ChromeExtension';

      if (chromeExtensionEligible && zoomEligible) showPromo(PromoBars[randomPromo]);
      else if (zoomEligible) showPromo(PromoBars.Zoom);
      else if (chromeExtensionEligible) showPromo(PromoBars.ChromeExtension);
    }
  }, [
    linkedServices,
    startGoogleSignInFlow,
    meeting,
    nonUserInvitees,
    showInviteColleaguesModal,
    currentUser,
    didShowInviteModalInMeeting,
    showPromo,
    wipFeature,
    handleShutdownLearnMore,
  ]);

  const [showShutdownModal, setShowShutdownModal] = useState(true);
  const shutdownModal = useMemo(() => {
    if (wipFeature !== 'shutdown_final') return <></>;

    return (
      <Modal
        title={
          <div className="CompoundModalTitle">
            <WarningIcon />
            {Shutdown.ShortTitle}
          </div>
        }
        open={showShutdownModal}
        footer={
          <>
            <Button
              onClick={() => {
                setShowShutdownModal(false);
                handleShutdownLearnMore();
              }}
            >
              Learn More
            </Button>
            <Button type={ButtonType.primary} onClick={() => setShowShutdownModal(false)}>
              OK
            </Button>
          </>
        }
        onCancel={() => setShowShutdownModal(false)}
      >
        <p>
          <strong>{Shutdown.LongTitle}.</strong> {Shutdown.Description}
        </p>
      </Modal>
    );
  }, [showShutdownModal, wipFeature, handleShutdownLearnMore]);

  return (
    <header className="AppHeader">
      {!isInSidebar && (
        <a href="/app" className="MiterLogo">
          <LogoLockupIcon />
        </a>
      )}

      <PromoBar />
      {!isInSidebar && (currentUser ? userAvatar : signInBtn)}

      {shutdownModal}
    </header>
  );
};

export default AppHeader;
