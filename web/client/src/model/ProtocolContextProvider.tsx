// Vendor
import ProtocolDrawer from 'core-components/Protocols/ProtocolDrawer';
import {Protocol, ProtocolItem, ProtocolType} from 'miter-common/SharedTypes';
import {createContext, FC, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import conn, {SocketConnectionListener} from 'SocketConnection';
import {waitATick} from 'Utils';
import {requestProtocolUserState, sendSoloState} from './ProtocolApi';
import {useMiterContext} from './MiterContextProvider';
import {getUserPreference, setUserPreference} from './UserPrefs';
import {ProtocolsIcon} from 'image';
import IntroModal from 'basic-components/IntroModal';
import {StrProtocols} from 'miter-common/Strings';
import {DrawerState} from 'basic-components/Drawer';
import {uuid} from 'miter-common/CommonUtil';

/**
 * A UUID is generated to identify this browser session (that is, this window in which the app is open). This is sent
 * along with some socket messages like `ProtocolUserStateRequest` to be able to identify when the request was made
 * from the current browser session and, therefore, we don't have to respond to it.
 */
const CurrentSessionId = uuid();

export type ProtocolMap = Record<string, Protocol>;
type ProtocolTypeMap = Record<string, ProtocolType>;
interface ProtocolContextValues {
  readonly showProtocolPickerModal: boolean;
  readonly setShowProtocolPickerModal: (showProtocolPickerModal: boolean) => void;
  readonly isDrawerExpanded: boolean;
  readonly isEveryoneDone: boolean;
  readonly busyUsersCount: number;
  readonly setIsDrawerExpanded: (isDrawerExpanded: boolean) => void;
  readonly isDrawerVisible: boolean;
  readonly setIsDrawerVisible: (isDrawerVisible: boolean) => void;
  readonly userActivityCount: number;
  readonly isSoloStateCompleted: boolean;
  readonly setIsSoloStateCompleted: (isSoloStateCompleted: boolean) => void;

  readonly protocolTypes: ProtocolTypeMap;
  readonly protocols: ProtocolMap;
  readonly setCurrentProtocol: (protocol: Protocol | null) => void;

  readonly currentProtocol: Protocol | null;
  readonly currentProtocolType: ProtocolType | null;
  closeProtocol: () => void;
  openProtocol: (protocolId?: string | null) => void;
}

const ProtocolContext = createContext<ProtocolContextValues | null>(null);
ProtocolContext.displayName = 'Protocol Context';

// ---------------------------------------------------------------------------------------------------------------------
//                                                  CONTEXT HOOK
// ---------------------------------------------------------------------------------------------------------------------
export const useProtocolContext = () => {
  const values = useContext(ProtocolContext);
  if (!values) throw new Error('Attempted to use ProtocolContext values outside a ProtocolContext.');

  return values;
};

// ---------------------------------------------------------------------------------------------------------------------
//                                                 CONTEXT PROVIDER
// ---------------------------------------------------------------------------------------------------------------------
const ProtocolContextProvider: FC = ({children}) => {
  // Picker and intro modals.
  const [showProtocolPickerModal, setShowProtocolPickerModal] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);

  // Miter context
  const {meeting, currentUser, participants} = useMiterContext();

  // Drawer.
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(true);

  // Protocol data.
  const [protocolTypes, setProtocolTypes] = useState<ProtocolTypeMap>({});
  const [protocols, setProtocols] = useState<ProtocolMap>({});
  const [currentProtocol, setCurrentProtocol] = useState<Protocol | null>(null);
  const [currentProtocolType, setCurrentProtocolType] = useState<ProtocolType | null>(null);
  const [isSoloStateCompleted, setIsSoloStateCompleted] = useState(false);

  // Multiplayer state.
  const [userDoneMap, setUserDoneMap] = useState<Record<string, boolean>>({});
  const [busyUsersCount, setBusyUsersCount] = useState<number>(0);
  const [isEveryoneDone, setIsEveryoneDone] = useState(false);
  const [userActivityCount, setUserActivityCount] = useState(0);
  const soloStateLastReceivedAt = useRef(0);

  const closeProtocol = useCallback(() => {
    setIsDrawerVisible(false);
    setTimeout(() => {
      setCurrentProtocol(null);
      setIsDrawerExpanded(false);
      setIsSoloStateCompleted(false);
    }, 300);
  }, []);

  useEffect(() => {
    const busyUsersCount = Object.values(userDoneMap).reduce((count, isUserDone) => count + (isUserDone ? 0 : 1), 0);
    setBusyUsersCount(busyUsersCount);
  }, [userDoneMap]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                                 INTRO MODAL
  // -------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!currentProtocol || !isDrawerExpanded) return;
    const userIsAuthenticated = Boolean(currentUser?.userId);
    const userDidNotCreateProtocol = currentProtocol?.creatorId !== currentUser?.userId;
    const shouldUserViewIntroModal =
      userIsAuthenticated && userDidNotCreateProtocol && getUserPreference('ShowProtocolIntroModal');
    const isFirstPhase = currentProtocol?.currentPhase?.index === 0;

    setShowIntroModal(shouldUserViewIntroModal && isFirstPhase);
  }, [currentProtocol, currentUser?.userId, isDrawerExpanded]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                                   PROTOCOL PICKER
  // -------------------------------------------------------------------------------------------------------------------
  // If someone else just created a protocol and the protocol picker was open, close the picker and open the protocol.
  useEffect(() => {
    if (showProtocolPickerModal && meeting?.currentProtocolId) {
      setShowProtocolPickerModal(false);
      setIsDrawerVisible(true);
      setIsDrawerExpanded(true);
    }
  }, [meeting?.currentProtocolId, showProtocolPickerModal]);

  // -------------------------------------------------------------------------------------------------------------------
  //                                                  MULTIPLAYER STATE
  // -------------------------------------------------------------------------------------------------------------------
  // When joining a new protocol, request everyone to report their solo state.
  useEffect(() => {
    // Only request protocol users' state when there's an open protocol and the user is authenticated.
    if (CurrentSessionId && currentProtocol?.id && currentUser?.userId) {
      requestProtocolUserState(CurrentSessionId, currentProtocol?.id);
    }
  }, [currentProtocol?.id, currentUser?.userId]);

  // Report the user state to others every time the solo state changes.
  useEffect(() => {
    // Don't try to emit the protocol state if there's no user currently signed in.
    if (!currentUser?.userId) return;

    // This line of code is to avoid an infinite loop when the solo state in two browser sessions get out of sync.
    if (soloStateLastReceivedAt.current + 1000 > Date.now()) return;

    // Report the solo state only if the current meeting protocol is open. If a different protocol is open and we send
    // the solo state, it will show up in the current meeting protocol activity indicator for other users.
    if (currentProtocol?.id === meeting?.currentProtocolId) sendSoloState(isSoloStateCompleted);
  }, [isSoloStateCompleted, meeting?.currentProtocolId, currentProtocol?.id, currentUser?.userId]);

  const currentMeetingIdRef = useRef(meeting?.id);

  useEffect(() => {
    if (currentMeetingIdRef.current !== meeting?.id) {
      currentMeetingIdRef.current = meeting?.id;
      if (!meeting?.currentProtocolId) closeProtocol();
    }
  }, [meeting?.currentProtocolId, meeting?.id, closeProtocol]);

  // Update the multiplayer state when the userDoneMap changes.
  useEffect(() => {
    setIsEveryoneDone(Object.values(userDoneMap).every(done => done));
  }, [userDoneMap]);

  // Update the users in the userDoneMap every time the participants change.
  useEffect(() => {
    setUserDoneMap(state => {
      for (const {userId} of participants) {
        // If the user just joined the meeting, initialize the solo state for the user.
        if (userId && !(userId in state)) {
          state[userId] = false;
        }
      }

      // If a user has left the meeting, delete them from the userDoneMap.
      for (const userId in state) {
        if (!participants.find(person => person.userId === userId)) {
          delete state[userId];
        }
      }

      return {...state};
    });
  }, [participants]);

  // Set the current protocol to NULL when the user navigates away from the current meeting.
  useEffect(() => {
    const currentProtocolId = meeting?.currentProtocolId;
    const currentProtocol = currentProtocolId ? protocols[currentProtocolId] : null;

    // If the user is logged out or the protocols data isn't loaded, don't open the protocol drawer.
    if (!currentUser || !currentProtocol) return;

    setCurrentProtocol(currentProtocol);
    setIsDrawerVisible(true);
  }, [meeting?.currentProtocolId, protocols, currentUser]);

  //------------------------------------------------------------------------------------------------------------------
  //                                                 PROTOCOL DATA
  //------------------------------------------------------------------------------------------------------------------
  // Update the current protocol type when the protocol changes or the protocol types are loaded.
  useEffect(() => {
    const typeId = currentProtocol?.typeId;
    if (typeId && typeId in protocolTypes) {
      setCurrentProtocolType(protocolTypes[typeId]);
    }
  }, [protocolTypes, currentProtocol]);

  //------------------------------------------------------------------------------------------------------------------
  //                                                PROTOCOL DRAWER
  //------------------------------------------------------------------------------------------------------------------
  const drawerState = useMemo(() => {
    if (!currentProtocol || !currentUser || !isDrawerVisible) return DrawerState.Closed;
    return isDrawerExpanded ? DrawerState.Expanded : DrawerState.Collapsed;
  }, [currentProtocol, isDrawerExpanded, isDrawerVisible, currentUser]);

  //--------------------------------------------------------------------------------------------------------------------
  //                                           SOCKET MESSAGE HANDLERS
  //--------------------------------------------------------------------------------------------------------------------

  // Refs to allow access to latest state-variable values without regenerating all the functions and re-registering all
  // the handlers.
  const currentProtocolRef = useRef(currentProtocol);
  useEffect(() => {
    currentProtocolRef.current = currentProtocol;
  }, [currentProtocol]);

  const protocolsRef = useRef(protocols);
  useEffect(() => {
    protocolsRef.current = protocols;
  }, [protocols]);

  const currentUserIdRef = useRef(currentUser?.userId);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.userId;
  }, [currentUser?.userId]);

  const meetingCurrentProtocolIdRef = useRef(meeting?.currentProtocolId);
  useEffect(() => {
    meetingCurrentProtocolIdRef.current = meeting?.currentProtocolId;
  }, [meeting?.currentProtocolId]);

  const isSoloStateCompletedRef = useRef(isSoloStateCompleted);
  useEffect(() => {
    isSoloStateCompletedRef.current = isSoloStateCompleted;
  }, [isSoloStateCompleted]);

  useEffect(() => {
    const handleProtocolTypes: SocketConnectionListener = body => {
      setProtocolTypes(protocolTypeMap => {
        body?.protocolTypes.forEach((type: ProtocolType) => {
          if (type.id) protocolTypeMap[type.id] = type;
        });

        // Return a new object to trigger a state change.
        return {...protocolTypeMap};
      });
    };

    const handleAllMeetingProtocols: SocketConnectionListener = body => {
      setProtocols(protocolMap => {
        body?.protocols.forEach((protocol: Protocol, i: number) => {
          // Update the protocol in the protocol map.
          if (protocol.id) protocolMap[protocol.id] = protocol;

          // If no protocol is currently open and there's a new current protocol for the meeting, open it.
          if (!currentProtocolRef.current && protocol.id === meetingCurrentProtocolIdRef.current) {
            setIsDrawerVisible(false);
            setIsSoloStateCompleted(false);
            setCurrentProtocol(protocol);
            waitATick(() => setIsDrawerVisible(true));
          }
        });

        // Return a new object to trigger a state change.
        return {...protocolMap};
      });
    };

    const handleProtocolItem: SocketConnectionListener = body => {
      const updatedProtocolItems: ProtocolItem[] = body?.updated || [];
      const createdProtocolItems: ProtocolItem[] = body?.created || [];
      const receivedProtocolItems: ProtocolItem[] = updatedProtocolItems.concat(createdProtocolItems);
      const deletedProtocolItems: ProtocolItem[] = body?.deleted || [];

      // Create a protocol map with an array of changed protocol items per protocol id.
      const protocolItemsByProtocolId = receivedProtocolItems.reduce((acc, item) => {
        const {protocolId} = item;
        if (!(protocolId in acc)) acc[protocolId] = [];
        acc[protocolId].push(item);
        return acc;
      }, {} as Record<string, ProtocolItem[]>);

      // Map each protocol's items with new updated or newly created protocol items.
      const updatedProtocols = Object.keys(protocolItemsByProtocolId).map(protocolId => {
        const protocolItems = protocolItemsByProtocolId[protocolId];
        const protocol = protocolsRef.current[protocolId];

        let updatedItems = protocolItems;
        if (protocol.items) {
          updatedItems = protocol.items.map(item => {
            const updatedItem = protocolItems.find(i => i.id === item.id);
            if (updatedItem) return updatedItem;
            return item;
          });
        }

        return {...protocol, items: updatedItems};
      });
      setProtocols(protocolsById => {
        updatedProtocols.forEach(protocol => {
          if (!protocol.id) return;
          protocolsById[protocol.id] = protocol;
        });
        return protocolsById;
      });

      // If the current protocol was updated, update the currentProtocol with the updated data.
      const updatedCurrentProtocol: Protocol | undefined = updatedProtocols.find(
        ({id}) => currentProtocolRef.current?.id === id
      );
      if (updatedCurrentProtocol) setCurrentProtocol(updatedCurrentProtocol);

      if (deletedProtocolItems) {
        setProtocols(protocolMap => {
          deletedProtocolItems.forEach(({protocolId, id: protocolItemId}) => {
            if (!(protocolId in protocolMap)) return;

            const protocol = protocolMap[protocolId];
            protocolMap[protocolId] = {...protocol, items: protocol.items?.filter(item => item.id !== protocolItemId)};

            if (protocolId === currentProtocolRef.current?.id) setCurrentProtocol(protocolMap[protocolId]);
          });

          return protocolMap;
        });
      }
    };

    const handleProtocol: SocketConnectionListener = body => {
      const updatedProtocols: Protocol[] = body?.updated || [];
      const createdProtocols: Protocol[] = body?.created || [];
      const deletedProtocols: Pick<Protocol, 'id'>[] = body?.deleted || [];
      const receivedProtocols: Protocol[] = updatedProtocols.concat(createdProtocols);

      setProtocols(protocolsById => {
        receivedProtocols.forEach(protocol => {
          if (!protocol.id) return;
          protocolsById[protocol.id] = protocol;
        });
        return protocolsById;
      });

      if (createdProtocols.length > 0) {
        // A new protocol was created and the user hasn't opened any protocol yet, automatically open the new protocol.
        const [createdProtocol] = createdProtocols;
        setCurrentProtocol(createdProtocols[0]);
        if (createdProtocol.creatorId === currentUserIdRef.current) {
          waitATick(() => {
            setIsDrawerExpanded(true);
          });
        }
      }

      if (deletedProtocols.length > 0) {
        // Delete protocols from the state.
        const newProtocols = {...protocols};
        deletedProtocols.forEach(({id}) => {
          if (id in newProtocols) delete newProtocols[id];
          // A protocol was deleted, if it was the current protocol, set the current protocol to NULL.
          if (id === currentProtocolRef.current?.id) closeProtocol();
        });
        setProtocols(newProtocols);
      }
      // If the current protocol was updated, update the currentProtocol with the updated data.
      const updatedCurrentProtocol: Protocol | undefined = updatedProtocols.find(
        ({id}) => currentProtocolRef.current?.id === id
      );
      if (updatedCurrentProtocol) setCurrentProtocol(updatedCurrentProtocol);
    };

    const handleUserActivity: SocketConnectionListener = body => {
      if (currentUserIdRef.current === body?.userId) return;
      // Increment the user activity count on each user activity event.
      setUserActivityCount(count => count + 1);

      setTimeout(() => {
        // Consider the user activity finished after three seconds.
        setUserActivityCount(count => count - 1);
      }, 3000);
    };

    const handleProtocolUserState: SocketConnectionListener = body => {
      if (!body?.userId) return;
      setUserDoneMap(currentValues => ({...currentValues, [body.userId]: body.isDone}));

      // Update the solo state based on the received socket message at most once every half a second.
      if (body.userId === currentUser?.userId && body.isDone !== isSoloStateCompletedRef.current) {
        setIsSoloStateCompleted(body.isDone);
        soloStateLastReceivedAt.current = Date.now();
      }
    };

    const handleProtocolUserStateRequest: SocketConnectionListener = body => {
      // Ignore protocol user state requests originated from this same browser or from a protocol other than the
      // current one. Don't send the solo-state if the user is not logged in.
      if (
        body?.sessionId !== CurrentSessionId &&
        body?.protocolId === currentProtocolRef.current?.id &&
        currentUserIdRef.current
      ) {
        sendSoloState(isSoloStateCompletedRef.current);
      }
    };

    conn.on('AllProtocolTypes', handleProtocolTypes);
    conn.on('AllMeetingProtocols', handleAllMeetingProtocols);
    conn.on('Protocol', handleProtocol);
    conn.on('ProtocolUserActivity', handleUserActivity);
    conn.on('ProtocolUserState', handleProtocolUserState);
    conn.on('ProtocolItem', handleProtocolItem);
    conn.on('ProtocolUserStateRequest', handleProtocolUserStateRequest);

    return () => {
      conn.off('AllProtocolTypes', handleProtocolTypes);
      conn.off('AllMeetingProtocols', handleAllMeetingProtocols);
      conn.off('Protocol', handleProtocol);
      conn.off('ProtocolUserActivity', handleUserActivity);
      conn.off('ProtocolUserState', handleProtocolUserState);
      conn.off('ProtocolItem', handleProtocolItem);
      conn.off('ProtocolUserStateRequest', handleProtocolUserStateRequest);
    };
  }, [protocols, closeProtocol, currentUser?.userId]);

  const openProtocol = useCallback(
    protocolId => {
      if (!protocolId) return;
      const protocol = protocols[protocolId];
      if (protocol) {
        setCurrentProtocol(protocol);
        waitATick(() => {
          setIsDrawerVisible(true);
          setIsDrawerExpanded(true);
        });
      }
    },
    [protocols, setCurrentProtocol, setIsDrawerExpanded, setIsDrawerVisible]
  );

  // -------------------------------------------------------------------------------------------------------------------
  //                                               EXPORTED VALUES
  // -------------------------------------------------------------------------------------------------------------------
  const values: ProtocolContextValues = {
    showProtocolPickerModal,
    setShowProtocolPickerModal,
    isDrawerExpanded,
    setIsDrawerExpanded,
    isDrawerVisible,
    setIsDrawerVisible,
    protocolTypes,
    protocols,
    currentProtocol,
    currentProtocolType,
    setCurrentProtocol,
    userActivityCount,
    isEveryoneDone,
    isSoloStateCompleted,
    setIsSoloStateCompleted,
    closeProtocol,
    openProtocol,
    busyUsersCount,
  };

  return (
    <ProtocolContext.Provider value={values}>
      <>
        {children}
        {currentUser && <ProtocolDrawer state={drawerState} />}

        {currentProtocolType && (
          <IntroModal
            open={showIntroModal}
            onClose={showAgain => {
              setShowIntroModal(false);
              setUserPreference('ShowProtocolIntroModal', showAgain);
            }}
            title={currentProtocolType.name}
            icon={<ProtocolsIcon />}
          >
            <p>{StrProtocols.IntroModalDescription}</p>
            <p>
              This is {currentProtocolType.name}: {currentProtocolType.description}
            </p>
          </IntroModal>
        )}
      </>
    </ProtocolContext.Provider>
  );
};

export default ProtocolContextProvider;
