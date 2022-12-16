import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import classNames from 'classnames';
import {postUnsafeMessageToParentWindow} from 'Utils';
import {ProductSurface} from 'miter-common/SharedTypes';
import socket from 'SocketConnection';

// Components.
import {IntroSteps, IntroStepStrings as ISS} from 'core-components/IntroSteps';
import {StepView} from 'basic-components/StepView';
import {CalendarIcon, CloseIcon, LogoLockupDarkBareIcon} from 'image';

// Assets.
import './StandardSignIn.less';
import {PrivacyNote} from '../PrivacyNote';
import {InviteColleagues} from 'core-components/InviteColleagues';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';
import {useMiterContext} from 'model/MiterContextProvider';
import {setUserPreference} from 'model/UserPrefs';

interface StandardSignInProps {}

const SignInStateToStepMap: SignInState[] = ['Pending', 'SignedOut', 'Partial', 'SignedIn'];

// If we're embedded in a modal, close it.
//
// Note that we're sending the message to the parent frame without checking
// its origin, which in some circumstances could be a security risk. But
// in this case I don't think so: all we're saying is we want to hide the
// modal, which is already evident to anyone trying to poke at our app.
//
const closeModal = () => postUnsafeMessageToParentWindow({miter: true, type: 'HIDE_MODAL', payload: {}});

const StandardSignIn: React.FC<StandardSignInProps> = () => {
  const {colleagues, expandColleaguesList, sendInviteEmail, fetchColleagues, shouldShowMoreColleagues} =
    useInviteColleaguesContext();
  const {linkedServices} = useMiterContext();
  const [signInState, setSignInState] = useState<SignInState>('Pending');
  const [productSurface, setProductSurface] = useState<ProductSurface | undefined>(undefined);
  const queryParams = new URLSearchParams(window.location.search);
  const isZoomApp = queryParams.get('isZoomApp') === 'true';
  const isInIframe = window !== window.top;
  const completedClientLibSetup = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);

  //--------------------------------------------------------------------------------------------------------------------
  //                                                   ACTIONS
  //--------------------------------------------------------------------------------------------------------------------
  const finishLogin = useCallback(() => {
    setCurrentStep(4);

    // Note that we're sending this message to the parent frame without checking
    // its origin, which in some circumstances could be a security risk. But
    // in this case I don't think so: all we're saying is that login succeeded,
    // which is alreaedy evident to anyone trying to poke at our app.
    if (isInIframe && signInState === 'SignedIn') {
      postUnsafeMessageToParentWindow({miter: true, type: 'FINISH_LOGIN', payload: {}});
    }

    if (isInIframe && productSurface === ProductSurface.WebApp) closeModal();
    else if (isZoomApp) window.location.href = '/api/zoom/deep-link';
  }, [signInState, isInIframe, productSurface, isZoomApp]);

  const handleInviteColleagues = useCallback(
    people => {
      sendInviteEmail(people);
      setUserPreference('ShowInviteColleaguesCTA', false); // Don't show the CTA in the TaskList.
      finishLogin();
    },
    [sendInviteEmail, finishLogin]
  );

  //--------------------------------------------------------------------------------------------------------------------
  //                                                   EFFECTS
  //--------------------------------------------------------------------------------------------------------------------
  // When miterLib loads, get the product surface and update it.
  useEffect(() => {
    window.didMiterLibLoad().then(() => setProductSurface(window.miterLib.getProductSurface()));
  }, []);

  // Which step of onboarding are we on, based on sign-in state? This
  // is sort of a 1-indexed thing, but then we're using 0 to represent
  // pending or error.
  useEffect(() => {
    const idx = SignInStateToStepMap.indexOf(signInState);
    if (idx !== -1) setCurrentStep(idx);
  }, [signInState]);

  // On initial mount, wait for client lib to load, then get sign-in info and register callbacks.
  useEffect(() => {
    // Ensure we only run this once
    if (completedClientLibSetup.current) return;
    else completedClientLibSetup.current = true;

    window.didMiterLibLoad().then(() => {
      window.miterLib.onGoogleSignIn(async newSignInState => {
        await socket.authenticate();
        await fetchColleagues();

        // The timeout is to prevent the "No colleagues found" message from showing for a split of a second.
        setSignInState(newSignInState);
      });

      window.miterLib.onGoogleSignOut(() => {
        setSignInState('SignedOut');
      });

      // (TODO) When we've reached this screen via the "Connect Calendar" function inside our Zoom App, we want to ensure we
      // merge any preexisting Google-authed account with the Zoom one. The right way to do that would probably be to
      // separate out the account-merge functionality so a signed-in Google-authed user gets merged when this page loads
      // and then we immediately redirect back to the Zoom App. For now, this should suffice. Worth revisiting if a lot
      // of people start this flow and then bail out. Or maybe regardless at some point.
      if (isZoomApp) window.miterLib.signOutOfGoogle();
    });
  }, [isZoomApp, fetchColleagues]);

  // Update the curent signInState when the linked services change.
  useEffect(() => {
    let state: SignInState = 'Pending';
    if (isZoomApp) state = 'SignedOut';
    else if (linkedServices?.GoogleCalendar) state = 'SignedIn';
    else if (linkedServices?.Google) state = 'Partial';
    else if (linkedServices) state = 'SignedOut';
    setSignInState(state);
  }, [isZoomApp, linkedServices]);

  //--------------------------------------------------------------------------------------------------------------------
  //                                                DOM STRUCTURE
  //--------------------------------------------------------------------------------------------------------------------
  const stepBar = useMemo(
    () => (
      <div className="Steps">
        <StepView step={1} text="Sign in" currentStep={currentStep} />
        <StepView step={2} text="Connect your calendar" currentStep={currentStep} />
        <StepView step={3} text="Invite Colleagues" currentStep={currentStep} />
      </div>
    ),
    [currentStep]
  );

  const mainContent = useMemo(() => {
    switch (currentStep) {
      case 1: // Not signed in
        return (
          <>
            <p>
              Welcome to Miter! Let’s get you set up. Whether you’re new to Miter or returning, begin by signing in with
              Google.
            </p>
            <div className="Buttons">
              <button onClick={() => window.miterLib.signInWithGoogle()} className="GoogleSignIn">
                <span>Sign In with Google</span>
              </button>
            </div>
            <PrivacyNote />
          </>
        );

      case 2: // Signed in but lacking calendar access
        return (
          <>
            <p>
              OK, you’re signed into Miter! Next, we need access to your calendar so we can see the details of your
              meetings.
            </p>
            <div className="Buttons">
              <button className="Btn" onClick={() => window.miterLib.signInWithGoogle(true)}>
                <CalendarIcon />
                <span>Connect My Calendar</span>
              </button>
            </div>
            <PrivacyNote />
          </>
        );

      case 3: {
        // Fully signed in, show invite
        return (
          <InviteColleagues
            people={colleagues}
            onShowMore={expandColleaguesList}
            isListExpanded={shouldShowMoreColleagues}
            cancelBtnLabel="Skip This"
            onInvite={handleInviteColleagues}
            onCancel={finishLogin}
          />
        );
      }

      case 4: // Past invite and done
        return (
          <>
            {productSurface === ProductSurface.ChromeExtension ? (
              <>
                <h3>Get to Know Miter</h3>
                <IntroSteps
                  stepContent={[ISS.OpenFromGCal, ISS.AddGoalAndTopics, ISS.NotesAndOutcomes, ISS.ReceiveSummary]}
                />
                <div className="Buttons">
                  <button className="Btn" onClick={closeModal}>
                    <span>Start Mitering</span>
                  </button>
                </div>
              </>
            ) : (
              <h3>All set! {isInIframe || isZoomApp ? 'One moment please...' : ''}</h3>
            )}
            <div className="Buttons Secondary">
              <button onClick={() => window.miterLib.signOutOfGoogle()}>Sign Out</button>
            </div>
          </>
        );

      default:
        return (
          <div>
            {
              // TODO Improve errors
              signInState === 'Error' ? 'Error' : 'Loading...'
            }
          </div>
        );
    }
  }, [
    currentStep,
    productSurface,
    isInIframe,
    isZoomApp,
    signInState,
    colleagues,
    expandColleaguesList,
    finishLogin,
    handleInviteColleagues,
    shouldShowMoreColleagues,
  ]);

  return (
    <div className={classNames('StandardSignIn', `Step${currentStep}`)}>
      <header>
        <LogoLockupDarkBareIcon className="Logo" />
        <h1>Welcome!</h1>
        {isInIframe && (
          <button onClick={closeModal} className="CloseBtn">
            <CloseIcon />
          </button>
        )}
      </header>
      {stepBar}
      <div className="ContentScroll">
        <div className="Content">{mainContent}</div>
      </div>
    </div>
  );
};

export default StandardSignIn;
