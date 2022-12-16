/*
 * TODO Note that there are three copies of this file--server/static-src, /web/welcome, and /web/client.
 */

declare global {
  type SignInState = 'Pending' | 'Partial' | 'SignedIn' | 'SignedOut' | 'Error' | 'Unavailable';
  type SignInService = 'Google' | 'Zoom';
  type SignInStateList = Record<SignInService, SignInState>;
  type FinishAuthHandler = (state: SignInState) => void;
  interface LinkedServicesState {
    Google: boolean;
    GoogleCalendar: boolean;
    Zoom: boolean;
    ChromeExtension: boolean;
  }
  interface MiterLib {
    onFinishGoogleAuth: (handler: FinishAuthHandler) => void;
    onGoogleSignIn: (handler: (state: SignInState) => void) => void;
    onGoogleSignOut: (handler: () => void) => void;
    authorizeZoomSdk: () => Promise<void>;
    onZoomSDKLoaded: (handler: () => void) => void;
    onZoomSDKError: (handler: () => void) => void;
    getMiterUserId: () => Promise<string | null>;
    fetchLinkedServices: () => Promise<LinkedServicesState>;
    getProductSurface: () => ProductSurface;
    signInWithGoogle: (useAllScopes?: boolean) => void;
    signOutOfGoogle: () => void;
    signOut: () => void;
  }

  interface Window {
    heap?: any;
    Debug?: boolean;
    gapi?: any;
    google?: any;
    GoogleScope?: string;
    GoogleInitialScope?: string;
    GoogleClientId?: string;
    HubspotSignupUrl?: string;
    HeapEnvId?: string;
    miterLib: MiterLib;
    zoomSdk: ZoomSDK;
    didMiterLibLoad: () => Promise<boolean>;
    HttpHost: string;
  }

  // ===================================================================================================================
  //                                                 ZOOM SDK TYPES
  // ===================================================================================================================
  type ZoomAppCommands =
    | 'openUrl'
    | 'showAppInvitationDialog'
    | 'getMeetingContext'
    | 'getRunningContext'
    | 'launchAppInMeeting';

  interface ZoomAppURLOptions {
    url: string;
  }

  interface ZoomSDK {
    config: (options: any) => any;
    getMeetingContext: () => Promise<any>;
    getRunningContext: () => Promise<any>;
    launchAppInMeeting: () => Promise<any>;
    openUrl: (options: ZoomAppURLOptions) => Promise<any>;
    callZoomApi: (cmd: ZoomAppCommands, opts: Record<string, string>) => void;
  }
}

export {};
