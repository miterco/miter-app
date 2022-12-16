import React, {useCallback, useEffect, useRef, useState} from 'react';
import conn, {SocketConnectionListener} from '../SocketConnection';
import {validateMeetingResponse} from './Validators';
import {MeetingWithTokenValue} from 'miter-common/SharedTypes';
import {fetchMeetingList} from './MeetingApi';

const ReloadIntervalMin = 15;

interface MeetingListContextValues {
  readonly meetingList: MeetingWithTokenValue[] | null;
  readonly isLoading: boolean;
  loadMeetingList: (callContext: string) => void; // Loads or reloads the meeting list, regardless of whether it's been loaded
  reloadMeetingList: (callContext: string) => void; // Reloads the meeting list if it's been loaded
}

const MeetingListContext = React.createContext<MeetingListContextValues | null>(null);
MeetingListContext.displayName = 'Meeting List Context';

export const useMeetingListContext = (): MeetingListContextValues => {
  const values = React.useContext(MeetingListContext);
  if (!values) throw new Error('Attempted to use MeetingListContext values outside a MeetingListContext.');
  return values;
};

interface MiterContextProviderProps {
  children: React.ReactNode;
}

const MeetingListContextProvider: React.FC<MiterContextProviderProps> = ({children}) => {
  const [meetingList, _setMeetingList] = useState<MeetingWithTokenValue[] | null>(null);
  const [isLoading, _setIsLoading] = useState(true);
  const reloadTimer = useRef(0);

  const didInitiallyLoadMeetingList = useRef(false);
  const [lastReceivedMeetingTimestamp, setLastReceivedMeetingTimestamp] = useState(0);
  const receivedMeetingId = useRef<string>('');

  // On mount...
  useEffect(() => {
    // Listen for updates to the current meeting, if any, so we can update the meeting list.
    conn.on('Meeting', handleMeeting);

    // On unmount...
    return () => {
      conn.off('Meeting', handleMeeting);
      // eslint-disable-next-line
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    };
    // eslint-disable-next-line
  }, []);

  const loadMeetingList = useCallback(async (callContext: string) => {
    _setIsLoading(true);
    const meetings = await fetchMeetingList(callContext);
    _setIsLoading(false);
    _setMeetingList(meetings);
    if (!didInitiallyLoadMeetingList.current) didInitiallyLoadMeetingList.current = true;
    if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(loadMeetingList, ReloadIntervalMin * 60 * 1000);
  }, []);

  const reloadMeetingList = useCallback(
    async (callContext: string) => {
      if (didInitiallyLoadMeetingList.current) loadMeetingList(`reload_${callContext}`);
    },
    [loadMeetingList]
  );

  /*
   * When we receive an updated meeting from the server, we may want to reload the list.
   * The handler simply sets the receivedMeetingId flag to trigger the effect below, which
   * can execute inside the component in a way the handler can't.
   */
  const handleMeeting: SocketConnectionListener = body => {
    receivedMeetingId.current = validateMeetingResponse(body).meeting?.id || '';
    setLastReceivedMeetingTimestamp(new Date().getTime());
  };

  /*
   * When receivedMeetingId turns non-null, it's because the handler above received a meeting
   * from the server. We may or may not want to update the meeting list accordingly.
   */
  useEffect(() => {
    if (receivedMeetingId.current && didInitiallyLoadMeetingList.current) {
      // Only take action if we've populated the meeting list and receivedMeetingId has been set.
      // TODO for now we just update the list. In the future we may want to restrict updates to stuff
      // already in the list, or check whether the meeting in question belongs in the list time-wise.
      reloadMeetingList('handler'); // Update only if we already have some data
    }
  }, [lastReceivedMeetingTimestamp, reloadMeetingList]);

  const values: MeetingListContextValues = {
    meetingList,
    isLoading,
    loadMeetingList,
    reloadMeetingList,
  };

  return <MeetingListContext.Provider value={values}>{children}</MeetingListContext.Provider>;
};

export default MeetingListContextProvider;
