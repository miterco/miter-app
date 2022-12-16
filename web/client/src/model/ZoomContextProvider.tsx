import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';

export enum ZoomAppContext {
  NotInZoom = 'notInZoom',
  Pending = 'pending',
  InMeeting = 'inMeeting',
  InImmersive = 'inImmersive',
  InWebinar = 'inWebinar',
  InMainClient = 'inMainClient',
}

interface ZoomContextValues {
  readonly zoomSdkLoaded: boolean;
  readonly isZoomApp: boolean;
  readonly zoomContext: ZoomAppContext;
}

const ZoomContext = React.createContext<ZoomContextValues | null>(null);
ZoomContext.displayName = 'Zoom Context';

export const useZoomContext = (): ZoomContextValues => {
  const values = React.useContext(ZoomContext);
  if (!values) throw new Error('Attempted to use ZoomContext values outside a ZoomContext.');

  return values;
};

interface ZoomContextProviderProps {
  children: React.ReactNode;
}

const ZoomContextProvider: React.FC<ZoomContextProviderProps> = ({children}) => {
  const query = new URLSearchParams(window.location.search);
  const isZoomApp = query.get('isZoomApp') === 'true';
  const [zoomSdkLoaded, setZoomSdkLoaded] = useState(window.zoomSdk !== undefined);
  const [zoomContext, setZoomContext] = useState<ZoomAppContext>(ZoomAppContext.Pending);
  const location = useLocation();

  // Force the zoomSdk to authorize again on each location change.
  useEffect(() => {
    setZoomContext(ZoomAppContext.Pending);
  }, [location]);

  // Wait for miterLib to load to set the ZoomSDKLoaded event handler.
  let attempts = 0;
  const miterLibInterval = setInterval(() => {
    if (window.miterLib) {
      window.miterLib.onZoomSDKLoaded(() => setZoomSdkLoaded(true));
      window.miterLib.onZoomSDKError(() => setZoomContext(ZoomAppContext.NotInZoom));
      clearInterval(miterLibInterval);
    }
    if (attempts++ > 15) clearInterval(miterLibInterval); // Give up if the library hasn't loaded after 15 seconds.
  }, 1000);

  // Retrieve the current context of the zoom app (whether it is open in a meeting or in the main client).
  useEffect(() => {
    if (!zoomSdkLoaded) return;
    if (zoomContext === ZoomAppContext.Pending) {
      window.didMiterLibLoad().then(() => {
        window.miterLib.authorizeZoomSdk().then(() => {
          window.zoomSdk.getRunningContext().then(ctx => setZoomContext(ctx));
        });
      });
    }
  }, [zoomSdkLoaded, zoomContext]);

  const values: ZoomContextValues = {
    isZoomApp,
    zoomSdkLoaded,
    zoomContext,
  };

  return <ZoomContext.Provider value={values}>{children}</ZoomContext.Provider>;
};

export default ZoomContextProvider;
