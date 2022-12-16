/*
 * Basic client-side functionality (primarily auth) shared by our React app and Chrome extension.
 *
 * NOTE: This is processed via an Express endpoint that prepends a bunch of environment variables whose existence
 * is expected by the code here.
 */

enum ProductSurface {
  WebApp = 'WebApp',
  ChromeExtension = 'ChromeExtension',
  ZoomApp = 'ZoomApp',
  Unknown = 'Unknown',
}

const miterLib: MiterLib = (() => {
  let _onFinishGoogleAuth: FinishAuthHandler | null = null;
  let _onGoogleSignIn: ((state: SignInState) => void) | null = null;
  let _onGoogleSignOut: (() => void) | null = null;

  let _zoomSignInState: SignInState = 'Pending';

  const onFinishGoogleAuth = (handler: FinishAuthHandler) => {
    _onFinishGoogleAuth = handler;

    // In some cases, Google auth might initialize BEFORE this handler is set. I don't think we run into this same issue
    // with the remaining on* functions below, though, because those callbacks only trigger after an explicit
    // user-facing sign-in flow.
    const currentState = getCurrentGoogleSignInState();
    if (currentState !== 'Pending') _onFinishGoogleAuth(currentState);
  };

  const onGoogleSignIn = (handler: (state: SignInState) => void) => {
    _onGoogleSignIn = handler;
  };

  const onGoogleSignOut = (handler: () => void) => {
    _onGoogleSignOut = handler;
  };

  // -------------------------------------------------------------------------------------------------------------------
  //                                               ANALYTICS & LOGGING
  // -------------------------------------------------------------------------------------------------------------------

  const productSurface = (() => {
    const query = new URLSearchParams(window.location.search);

    // (1) If there's any indication we're in Zoom, that wins.
    if (query.get('isZoomApp') === 'true' || window.navigator.userAgent.includes('ZoomApps')) {
      return ProductSurface.ZoomApp;
    }

    // (2) If we're not in an iframe, we should be in the web app. The only exception I'm aware of is when we load
    // sign-in from the Zoom app, in which case (1) should have caught this.
    if (window === window.top) return ProductSurface.WebApp;

    // (3) If we're here, we're in an iframe.
    try {
      window.top.location.href; // This will throw if we don't have cross-origin access...
      // ...so if we're here, we own the top frame as well as the iframe and it's the web app.
      return ProductSurface.WebApp;
    } catch {
      // If we end up in this block it's because access to the top-level window was blocked, meaning we're on somebody
      // else's site, so (at least for now) we're dealing with the Chrome extension.
      return ProductSurface.ChromeExtension;
    }
  })();

  const getProductSurface = () => productSurface;

  if (window.HeapEnvId) {
    // @ts-ignore
    window.heap = window.heap || [];
    window.heap.load = function (e, t) {
      (window.heap.appid = e), (window.heap.config = t = t || {});
      var r = document.createElement('script');
      (r.type = 'text/javascript'), (r.async = !0), (r.src = 'https://cdn.heapanalytics.com/js/heap-' + e + '.js');
      var a = document.getElementsByTagName('script')[0];
      a.parentNode.insertBefore(r, a);
      for (
        var n = function (e) {
            return function () {
              window.heap.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          },
          p = [
            'addEventProperties',
            'addUserProperties',
            'clearEventProperties',
            'identify',
            'resetIdentity',
            'removeEventProperty',
            'setEventProperties',
            'track',
            'unsetEventProperty',
          ],
          o = 0;
        o < p.length;
        o++
      )
        window.heap[p[o]] = n(p[o]);
    };
    window.heap.load(window.HeapEnvId);
    window.heap.addEventProperties({Surface: productSurface});
  }

  const track = (event: string, properties?: Record<string, string>) => {
    if (window.heap) window.heap.track(event, properties);
  };

  const identify = (identifier: string) => {
    log(`Identifying user ${identifier}`);
    if (identifier && window.heap) window.heap.identify(identifier);
  };

  const addUserProperties = (properties: Record<string, string>) => {
    log(`Adding user properties ${JSON.stringify(properties)}`);
    if (window.heap) window.heap.addUserProperties(properties);
  };

  const log = (str: string) => {
    if (window.Debug) console.log(str);
  };

  const sendSignupToHubspot = async (email: string) => {
    if (window.HubspotSignupUrl) {
      const hsCookie = document.cookie.split('; ').find(cookie => cookie.startsWith('hubspotutk='));
      const hsCookieValue = hsCookie?.split('=')[1] || undefined;

      try {
        const body = {
          fields: [{name: 'email', objectTypeId: 'contact', value: email}],
          context: {hutk: hsCookieValue},
        };

        const fetchResponse = await fetch(window.HubspotSignupUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(body),
        });

        const returnedJson = await fetchResponse.json();

        if (fetchResponse.status === 200) log('Logged sign-up info to Hubspot.');
        else console.warn(`Error while logging log sign-up info to Hubspot: ${returnedJson.message}`);
      } catch (err) {
        console.warn(`Unable to contact Hubspot to log sign-up info: ${err}`);
      }
    } else {
      console.warn('Missing Hubspot sign-up form ID.');
    }
  };

  // -------------------------------------------------------------------------------------------------------------------
  //                                     GOOGLE AUTH: INIT AND INITIAL AUTH CHECK
  // -------------------------------------------------------------------------------------------------------------------

  const {getCurrentGoogleSignInState, setCurrentGoogleSignInState} = (() => {
    let _googleSignInState: SignInState = 'Pending';
    const setter = (state: SignInState) => {
      log(`Setting cached Google sign-in state to ${state}.`);
      _googleSignInState = state;
    };
    const getter = () => _googleSignInState;
    return {
      getCurrentGoogleSignInState: getter,
      setCurrentGoogleSignInState: setter,
    };
  })();

  const handleGoogleAuthLibraryError = () => {
    log('Google auth failed to load. Setting sign-in state to Unavailable.');
    setCurrentGoogleSignInState('Unavailable');
    if (_onFinishGoogleAuth) _onFinishGoogleAuth(getCurrentGoogleSignInState());
  };

  // -------------------------------------------------------------------------------------------------------------------
  //                                         GOOGLE AUTH: SIGNING IN AND OUT
  // -------------------------------------------------------------------------------------------------------------------

  /*
   * Exported: Initiate a Google sign-in. A consumer of this file is expected to
   * (1) call onFinishAuth() to detect when auth state is resolved;
   * (2) as appropriate, call this function to initiate an actual Google login flow;
   * and then (3) call onSignIn() and onFailedSignIn() to handle the results.
   */
  const signInWithGoogle = async (useAllScopes: boolean = false) => {
    log('Initiating Google sign-in.');
    try {
      const client = await window.google.accounts.oauth2.initCodeClient({
        client_id: window.GoogleClientId,
        scope: useAllScopes ? window.GoogleScope : window.GoogleInitialScope,
        ux_mode: 'popup',
        callback: handleGoogleSignIn,
      });
      client.requestCode();
    } catch (err: any) {
      log(`Sign-in failed using ${useAllScopes ? 'all' : 'initial'} scopes.`);
      handleGoogleSignInFailed(err);
    }
  };

  const signOutOfGoogle = () => {
    log('Initiating Google sign-out.');
    setCurrentGoogleSignInState('SignedOut');
    log('Signed out.');

    if (_onGoogleSignOut) _onGoogleSignOut();
  };

  const signOut = async () => {
    document.cookie = 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'; // Delete the Miter access token.
    await signOutOfGoogle();
  };

  const handleGoogleSignIn = async (gAuthResponse: any) => {
    // We just logged in or there was a preexisting session
    // We're reloading the auth response both because, y'know, we need it, and also because if we just use the one the
    // client already has it seems sometimes to be out of date.
    log('Handle google sign in');
    log(gAuthResponse);

    // Post it to the server
    log('Signing into Miter server...');
    const response = await fetch('/api/sign-in', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        code: gAuthResponse['code'],
        productSurface,
        tzOffset: new Date().getTimezoneOffset() * 60,
      }),
    });
    const data = await response.json();
    log(`/api/sign-in returned ${JSON.stringify(data)}`);

    if (data.error) {
      console.log("Sign-in error: Miter sign-in didn't return a valid token.");
      alert('Sign-in Error.');
      return;
    }

    log('Looks like Miter server sign-in succeeded.');

    setCurrentGoogleSignInState((await isPartialGoogleSignIn()) ? 'Partial' : 'SignedIn');
    log(`Set sign-in state to ${getCurrentGoogleSignInState()}.`);

    // For new users, send sign-in event to HubSpot
    // Intentionally not awaiting...not 100% sure this is good because the window may close
    if (data.isNewUser) sendSignupToHubspot(data.loginEmail);

    // TODO: this will become unnecessary (though not harmful) once the withHttpUser on the server can identify a user
    // who's signed in via Google.
    identify(data.loginEmail);

    track(`Complete ${getCurrentGoogleSignInState() === 'Partial' ? 'Partial' : 'Full'} Google Sign-In`, {
      'New User': String(data.isNewUser),
    });

    if (_onGoogleSignIn) _onGoogleSignIn(getCurrentGoogleSignInState());
  };

  const handleGoogleSignInFailed = (error: any) => {
    console.error(`Google sign-in error: ${error}.`);
    setCurrentGoogleSignInState('Error');
  };

  // -------------------------------------------------------------------------------------------------------------------
  //                                        AUTH: ACCESSING AUTH INFORMATION
  // -------------------------------------------------------------------------------------------------------------------

  const isPartialGoogleSignIn = async (): Promise<boolean> => {
    const {Google: isLinkedGoogle, GoogleCalendar: isLinkedGoogleCalendar} = await fetchLinkedServices();
    return isLinkedGoogle && !isLinkedGoogleCalendar;
  };

  //================================================================================================
  //                                       MITER TOKEN
  //================================================================================================

  const {getCurrentMiterSignInState, getMiterUserId, fetchLinkedServices} = (() => {
    const CheckMiterSignInUrl = '/api/auth/check';
    const FetchLinkedServicesUrl = '/api/auth/linked-services';
    let _miterSignInState: SignInState = 'Pending';
    let _miterUserId: string | null = null;

    const getter = () => _miterSignInState;

    /*
     * TODO: Our current build process doesn't give us access to the rest of the codebase from this file, so yeah, I'm
     * duplicating validation code here. Bleh.
     */
    const validateAuthCheckResponse = (
      data: any
    ): {
      isAuthenticated: boolean;
      userId?: string;
      loginEmail?: string;
    } => {
      if (data.error) throw new Error(typeof data.error === 'string' ? data.error : 'Unknown error');
      if (typeof data.body !== 'object')
        throw new Error(`Auth-check response is missing a valid body; got ${typeof data.body}`);
      if (typeof data.body.isAuthenticated !== 'boolean') {
        throw new Error(
          `Auth-check response has non-boolean isAuthenticated value (type ${typeof data.body.isAuthenticated})`
        );
      }

      if (!data.body.isAuthenticated) return {isAuthenticated: false};

      if (typeof data.body.userId !== 'string') {
        throw new Error(`Auth-check response expected a string userID but got ${typeof data.body.userId}`);
      }
      if (typeof data.body.loginEmail !== 'string') {
        throw new Error(`Auth-check response expected a string email but got ${typeof data.body.loginEmail}`);
      }

      return {
        isAuthenticated: true,
        userId: data.body.userId,
        loginEmail: data.body.loginEmail,
      };
    };

    const fetchMiterSignInState = async (): Promise<boolean> => {
      log('Starting fetchMiterSignInState()');
      const authResponse = await fetch(CheckMiterSignInUrl);
      if (authResponse.status !== 200) throw new Error(`Auth check failed with status ${authResponse.status}.`);

      const authCheckResponse = validateAuthCheckResponse(await authResponse.json());
      if (authCheckResponse.isAuthenticated) {
        _miterUserId = authCheckResponse.userId;
        identify(authCheckResponse.loginEmail);
      } else {
        _miterUserId = null;
      }

      return Boolean(_miterUserId);
    };

    /*
     * May want to expose this one at some point.
     */
    const getFinalMiterSignInState = async () => {
      if (_miterSignInState !== 'Pending') return _miterSignInState; // Already fetched.

      try {
        _miterSignInState = (await fetchMiterSignInState()) ? 'SignedIn' : 'SignedOut';
      } catch (error) {
        console.error(`Miter sign-in error: ${error}`);
        _miterSignInState = 'SignedOut';
      }
    };

    const fetchLinkedServices = async (): Promise<LinkedServicesState> => {
      const response = await fetch(FetchLinkedServicesUrl);
      const {body} = await response.json();

      return {
        Google: Boolean(body.Google),
        GoogleCalendar: Boolean(body.GoogleCalendar),
        Zoom: Boolean(body.Zoom),
        ChromeExtension: Boolean(body.ChromeExtension),
      };
    };

    const getMiterUserId = async () => {
      await getFinalMiterSignInState();
      return _miterUserId;
    };

    getFinalMiterSignInState();

    return {
      getCurrentMiterSignInState: getter,
      getMiterUserId,
      fetchLinkedServices,
    };
  })();

  // Once we've loaded everything above, we're safe to load up the Google auth library.
  if (navigator.userAgent.indexOf('ZoomApps') !== -1) {
    // We're inside Zoom so just bypass trying to load the Google auth stuff
    // TODO may be temporary fix — it's a little brittle.
    log('Bypassing Google auth');
    handleGoogleAuthLibraryError();
  } else {
    const gscript = document.createElement('SCRIPT');
    gscript.setAttribute('src', 'https://accounts.google.com/gsi/client');
    gscript.setAttribute('defer', 'true');
    gscript.setAttribute('async', 'true');
    gscript.onerror = handleGoogleAuthLibraryError;
    document.head.appendChild(gscript);
  }

  //================================================================================================
  //                                     ZOOM APPS SDK
  //================================================================================================

  // Array of callback functions to be executed when the Zoom Apps SDK is loaded.
  const _zoomSDKLoadedCallbacks = [];
  const _zoomSDKErrorCallbacks = [];

  const onZoomSDKLoaded = (fn: Function) => {
    if (window.zoomSdk) fn();
    else _zoomSDKLoadedCallbacks.push(fn);
  };

  const onZoomSDKError = (fn: Function) => {
    if (_zoomSignInState === 'Error' || _zoomSignInState === 'SignedOut') fn();
    else _zoomSDKErrorCallbacks.push(fn);
  };

  const authorizeZoomSdk = async () => {
    log('Authorizing Zoom SDK');
    await window.zoomSdk.config({
      size: {width: 380},
      capabilities: [
        'getMeetingContext',
        'getRunningContext',
        'showAppInvitationDialog',
        'openUrl',
        'launchAppInMeeting',
      ],
    });
  };

  const initZoomSDK = async () => {
    if (window.zoomSdk) {
      await authorizeZoomSdk();
      _zoomSDKLoadedCallbacks.forEach(cb => cb());
      _zoomSignInState = 'SignedIn';
    } else {
      handleZoomSDKError('Not in Zoom');
      _zoomSignInState = 'SignedOut';
    }
  };

  // TODO: Possible future enhancement: have the loaded callbacks be promises, and then reject the promises on error.
  // (Same pattern as what we're doing with the explicit request/response pairing in socket server.)
  const handleZoomSDKError = (event: Event | string) => {
    if (event !== 'Not in Zoom') console.error('Zoom SDK failed to load', event);
    _zoomSignInState = 'Error';
    _zoomSDKErrorCallbacks.forEach(cb => cb());
  };

  const zoomSdkScript = document.createElement('script');
  zoomSdkScript.setAttribute('src', '/app/zoomSdk.js');
  zoomSdkScript.onload = initZoomSDK;
  zoomSdkScript.onerror = handleZoomSDKError;
  document.head.appendChild(zoomSdkScript);

  // -------------------------------------------------------------------------------------------------------------------
  //                                                     EXPORTS
  // -------------------------------------------------------------------------------------------------------------------

  const result: MiterLib = {
    onFinishGoogleAuth,
    onGoogleSignIn,
    onGoogleSignOut,
    authorizeZoomSdk,
    onZoomSDKLoaded,
    onZoomSDKError,
    getMiterUserId,
    fetchLinkedServices,
    getProductSurface,
    signInWithGoogle,
    signOutOfGoogle,
    signOut,
  };
  return result;
})();
