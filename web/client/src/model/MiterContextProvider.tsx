import {
  Note,
  Meeting,
  SummaryItem,
  Topic,
  Person,
  EmailRecipientWithId,
  ValidationError,
  LinkedServicesResponse,
  MeetingPhase,
  User,
  UserOrGuest,
  ErrorCode,
  MeetingResponse,
} from 'miter-common/SharedTypes';
import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import conn, {SocketConnectionListener} from '../SocketConnection';
import {requestTopics} from './TopicApi';
import {
  validateTopicsResponse,
  validateNotes,
  validateSummaryItemsResponse,
  validateUpdatedNotes,
  validateUpdatedSummaryItemsResponse,
  validatePeopleResponse,
  validateMeetingResponse,
  validateMeetingTokenResponse,
  validateRelevantPeopleResponse,
  validatePendingMeetingPhaseChangeResponse,
} from './Validators';
import useWidthObserver from '../hooks/useWidthObserver';
import {requestNotes} from './NoteApi';
import {fetchLinkedServices, getAuthenticationCheck} from './UserApi';
import {requestRelevantPeople} from './SummaryApi';
import {useNavigate} from 'react-router-dom';
import {log, track, waitATick} from '../Utils';
import {requestAllSummaryItems as requestSummaryItems} from './SummaryApi';
import {changeMeetingPhase_apiCallOnly} from './MeetingApi';
import {validateUserOrGuest} from 'miter-common/CommonUtil';
import * as Sentry from '@sentry/browser';
import {Promo} from 'basic-components/PromoBar';

/*
 * Internal type to track phase changes. This is different from the similar request type in SharedTypes to provide
 * latency compensation: changeTime is 'Waiting' when this client has requested a phase change but not yet received
 * info about it back from the server, allowing the UI to update immediately instead of with a lag.
 */
interface PendingPhaseInfo {
  phase: MeetingPhase;
  changeTime: number | 'Waiting';
}

// Note: We type these values as `Something[] | null` rather than just `Something[]` so
// we can distinguish between "server sent us Somethings and there are zero of them" (empty
// array) and "we haven't received any Somethings yet".
interface MiterContextValues {
  readonly wipFeature: string | null;
  readonly showSignInDialog: boolean;
  setShowSignInDialog: (show: boolean) => void;

  meeting: Meeting | null;
  meetingError: string | null;
  readonly pendingPhase: PendingPhaseInfo | null;
  handleChangePhaseAction: (phase: MeetingPhase, instant?: boolean) => void;
  summaryItems: SummaryItem[] | null;
  readonly notes: Note[] | null;

  readonly isInSidebar: Boolean;

  readonly topics: Topic[] | null;
  readonly currentTopic: Topic | null;
  readonly currentTopicIndex: number | null;
  getTopicById: (topicId: string | null) => Topic | null;

  readonly currentUser: Person | null;
  readonly linkedServices: LinkedServicesResponse | null;
  readonly signInState: SignInState;

  // TODO naming of these, plus we need to shore up our various concepts
  readonly participants: Person[]; // People currently present
  readonly relevantPeople: EmailRecipientWithId[]; // People that are relevant to the meeting.
  readonly attendees: Record<string, Person>; // People who've ever joined

  // Promo bar.
  readonly isPromoBarVisible: boolean;
  readonly hidePromoBar: () => void;
  readonly currentPromo: Promo | null;
  readonly showPromo: (promo: Promo) => void;
}

const MiterContext = React.createContext<MiterContextValues | null>(null);
MiterContext.displayName = 'Miter Context';

export const useMiterContext = (): MiterContextValues => {
  const values = React.useContext(MiterContext);
  if (!values) throw new Error('Attempted to use MiterContext values outside a MiterContext.');

  return values;
};

interface MiterContextProviderProps {
  children: React.ReactNode;
}

const SidebarWidth = 750; // Also need to change @major-breakpoint in Global.less

const MiterContextProvider: React.FC<MiterContextProviderProps> = ({children}) => {
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const {width} = useWidthObserver(document.body);
  const isInSidebar = useMemo(() => width <= SidebarWidth, [width]);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [meetingInfo, setMeetingInfo] = useState<{meeting: Meeting | null; error: string | null}>({
    meeting: null,
    error: null,
  });
  const [pendingPhase, setPendingPhase] = useState<PendingPhaseInfo | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [summaryItems, setSummaryItems] = useState<SummaryItem[] | null>(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number | null>(null);
  const [currentTopic, registerCurrentTopic] = useState<Topic | null>(null);
  const [currentUser, setCurrentUser] = useState<UserOrGuest | null>(null);
  const [linkedServices, setLinkedServices] = useState<LinkedServicesResponse | null>(null);
  const [signInState, setSignInState] = useState<SignInState>('Pending');
  const [participants, setParticipants] = useState<Person[]>([]);
  const [relevantPeople, setRelevantPeople] = useState<EmailRecipientWithId[]>([]);
  const [attendees, setAttendees] = useState<Record<string, Person>>({});

  //--------------------------------------------------------------------------------------------------------------------
  //                                               AUTHENTICATION
  //--------------------------------------------------------------------------------------------------------------------
  // Initialize the authentication state.
  useEffect(() => {
    getAuthenticationCheck().then(user => {
      setSignInState(user.isAuthenticated ? 'SignedIn' : 'SignedOut');
    });
  }, []);

  //--------------------------------------------------------------------------------------------------------------------
  //                                                  MEETINGS
  //--------------------------------------------------------------------------------------------------------------------
  // Refs for use inside socket handlers
  const meetingRef = useRef(meetingInfo.meeting);

  //--------------------------------------------------------------------------------------------------------------------
  //                                                  PROMO BAR
  //--------------------------------------------------------------------------------------------------------------------
  const [isPromoBarVisible, setIsPromoBarVisible] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Promo | null>(null);
  const isPromoBeingShown = useRef(false);
  const didShowPromo = useRef<Record<string, boolean>>({});
  const promoMeetingIdRef = useRef<string | undefined>(meetingInfo.meeting?.id); // The meeting in which the promo was rendered.

  const showPromo = useCallback(
    (promo: Promo) => {
      if (isPromoBarVisible || isPromoBeingShown.current) return;
      if (promo.hideInDesktop && !isInSidebar) return;
      if (promo.hideInSidebar && isInSidebar) return;
      if (promo.showOncePerSession && didShowPromo.current[promo.id]) return;
      promoMeetingIdRef.current = meetingInfo.meeting?.id;
      isPromoBeingShown.current = true;
      setIsPromoBarVisible(false);

      // Wait for the PromoBar to be completely hidden before rendering the new promo.
      setTimeout(() => {
        setCurrentPromo(promo);
        setIsPromoBarVisible(true);
      }, 300);
    },
    [isInSidebar, isPromoBarVisible, meetingInfo.meeting?.id]
  );

  const hidePromoBar = useCallback(() => {
    if (currentPromo) {
      didShowPromo.current[currentPromo.id] = true;
      setIsPromoBarVisible(false);

      // Wait for the state variables to be updated before flagging the promo bar as being able to display a new promo.
      waitATick(() => (isPromoBeingShown.current = false));
    }
  }, [currentPromo]);

  // When exiting a meeting, hide the promo bar if it is specific to a meeting.
  useEffect(() => {
    if (
      currentPromo?.closeOnMeetingChange &&
      promoMeetingIdRef.current && // The promo was shown while in a meeting.
      promoMeetingIdRef.current !== meetingInfo.meeting?.id // And that meeting has changed.
    ) {
      hidePromoBar();
    }
  }, [currentPromo?.closeOnMeetingChange, hidePromoBar, meetingInfo.meeting]);

  const navigate = useNavigate();

  const wipFeature = useMemo(
    () => (currentUser as User)?.wipFeature || process.env.REACT_APP_WIP_FEATURE || null,
    [currentUser]
  );

  // On mount...
  useEffect(() => {
    // Define handlers once since registration with SocketConnection moves them outside the context
    // of React and its hooks
    //

    // ================================================================================================
    //                                 MEETINGS - SOCKET HANDLERS
    // ================================================================================================

    const trackMeetingError = (response: MeetingResponse) => {
      if (response.errorCode === ErrorCode.NotAuthenticated) track('Attempt Signed-Out GEvent Access');
      else if (response.errorCode === ErrorCode.NotFound) track('Attempt Unavailable GEvent Access');
      else track('Receive Join-Meeting Error', {'Error Code': response.errorCode || 'Undefined'});
    };

    const handleMeeting: SocketConnectionListener = body => {
      const validBody = validateMeetingResponse(body);
      if (validBody.meeting) {
        log('Received a meeting.');
        const {meeting: newMeeting} = validBody;
        setMeetingInfo(prevMeeting => {
          if (newMeeting.phase !== prevMeeting?.meeting?.phase) setPendingPhase(null);
          return {meeting: newMeeting, error: null};
        });
      } else {
        setMeetingInfo({meeting: null, error: validBody.error || 'Unknown error'});
        trackMeetingError(validBody);
      }
    };

    const handleMeetingToken: SocketConnectionListener = body => {
      const tokenVal = validateMeetingTokenResponse(body).tokenValue;
      const currentPath = window.location.pathname;
      const lastSlash = currentPath.lastIndexOf('/');
      const currentIdentifier = lastSlash >= 0 ? currentPath.substr(lastSlash + 1) : '';
      if (tokenVal !== currentIdentifier) {
        log('Replacing current identifier with token.');
        navigate(`/m/${tokenVal}${window.location.search}`, {replace: true});
      }
    };

    const handlePendingPhaseChange: SocketConnectionListener = body => {
      const response = validatePendingMeetingPhaseChangeResponse(body);
      setPendingPhase(response);
    };

    const handleCanceledPhaseChange: SocketConnectionListener = body => {
      setPendingPhase(null);
    };

    const handleLeftMeeting: SocketConnectionListener = body => {
      setMeetingInfo({meeting: null, error: null});
    };

    // ================================================================================================
    //                                 NOTES - SOCKET HANDLERS
    // ================================================================================================

    const handleAllNotes: SocketConnectionListener = body => {
      const validated = validateNotes(body).notes;
      setNotes(validated);
    };

    const handleUpdatedNotes: SocketConnectionListener = body => {
      setNotes(oldNotes => {
        if (!oldNotes) throw new ValidationError('Received updated notes prior to receiving all notes.');

        const updates = validateUpdatedNotes(body);
        const updatedNotes = [...oldNotes];
        updates.changed?.forEach(incomingNote => {
          for (let i = 0; i < updatedNotes.length; i++) {
            if (incomingNote.id === updatedNotes[i].id) {
              updatedNotes[i] = incomingNote;
              break;
            }
          }
        });
        updates.deleted?.forEach(deletedNote => {
          for (let i = 0; i < updatedNotes.length; i++) {
            if (deletedNote.id === updatedNotes[i].id) {
              updatedNotes.splice(i, 1);
              break;
            }
          }
        });
        updates.created?.forEach(createdNote => {
          updatedNotes.push(createdNote);
        });

        return updatedNotes;
      });
    };

    // ================================================================================================
    //                                PROTOCOLS - SOCKET HANDLERS
    // ================================================================================================
    const handleProtocolChange: SocketConnectionListener = _body => {
      // A re-render is needed to update the protocol note to show its completed state when it's done
      // or any changes in the protocol items.
      requestNotes();
    };

    // ================================================================================================
    //                                SUMMARIES - SOCKET HANDLERS
    // ================================================================================================

    const handleAllSummaryItems: SocketConnectionListener = body => {
      setSummaryItems(validateSummaryItemsResponse(body).summaryItems);
    };

    const handleUpdatedSummaryItems: SocketConnectionListener = body => {
      // TODO we may want to separate this file into multiple context providers, e.g., a top-level one and an
      // InMeetingContextProvider. For now, we just don't bother with callbacks for in-meeting data when there's no
      // meeting.

      if (meetingRef.current) {
        setSummaryItems(oldItems => {
          if (!oldItems) throw new ValidationError('Received updated summary items without first getting all items.');

          const updates = validateUpdatedSummaryItemsResponse(body);
          const newItems = [...oldItems];
          if (updates.changed) {
            updates.changed.forEach(item => {
              for (let i = 0; i < newItems.length; i++) {
                if (item.id === newItems[i].id) {
                  newItems[i] = item;
                  break;
                }
              }
            });
          }
          if (updates.deleted) {
            updates.deleted.forEach(item => {
              for (let i = 0; i < newItems.length; i++) {
                if (item.id === newItems[i].id) {
                  newItems.splice(i, 1);
                }
              }
            });
          }
          updates.created?.forEach(createdItem => {
            newItems.push(createdItem);
          });

          return newItems;
        });
      }
    };

    // ================================================================================================
    //                                  TOPICS - SOCKET HANDLERS
    // ================================================================================================

    const handleAllTopics: SocketConnectionListener = body => {
      const {topics} = validateTopicsResponse(body);
      setTopics(topics);
    };

    // ================================================================================================
    //                                 PEOPLE - SOCKET HANDLERS
    // ================================================================================================

    const handleCurrentUser: SocketConnectionListener = body => {
      try {
        const user = validateUserOrGuest(body);
        setCurrentUser(user);

        if (user && 'userId' in user) {
          Sentry.setUser({
            id: user.userId || undefined,
            username: user.displayName || undefined,
            email: user.email || undefined,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    const handleAttendance: SocketConnectionListener = body => {
      const attendeeArray = validatePeopleResponse(body).people;
      const newAttendees: Record<string, Person> = {};
      attendeeArray.forEach(attendee => {
        if (attendee.userId) newAttendees[attendee.userId] = attendee;
      });
      setAttendees(newAttendees);
    };

    const handleParticipantsChanged: SocketConnectionListener = body => {
      const validBody = validatePeopleResponse(body);
      setParticipants(validBody.people);
    };

    const handleAllRelevantPeople: SocketConnectionListener = body => {
      const {people} = validateRelevantPeopleResponse(body);
      setRelevantPeople(people);
    };

    // ================================================================================================
    //                                 COMPONENT LIFECYCLE
    // ================================================================================================

    // On mount, register handlers
    conn.on('AllTopics', handleAllTopics);
    conn.on('AllNotes', handleAllNotes);
    conn.on('UpdatedNotes', handleUpdatedNotes);
    conn.on('UpdatedSummaryItems', handleUpdatedSummaryItems);
    conn.on('AllSummaryItems', handleAllSummaryItems);
    conn.on('Meeting', handleMeeting);
    conn.on('CurrentUser', handleCurrentUser);
    conn.on('ParticipantsChanged', handleParticipantsChanged);
    conn.on('AllAttendees', handleAttendance);
    conn.on('MeetingToken', handleMeetingToken);
    conn.on('AllRelevantPeople', handleAllRelevantPeople);
    conn.on('MeetingPhaseChangePending', handlePendingPhaseChange);
    conn.on('MeetingPhaseChangeCanceled', handleCanceledPhaseChange);
    conn.on('LeftMeeting', handleLeftMeeting);
    conn.on('Protocol', handleProtocolChange);

    // On unmount, deregister handlers
    return () => {
      conn.off('AllTopics', handleAllTopics);
      conn.off('AllNotes', handleAllNotes);
      conn.off('UpdatedNotes', handleUpdatedNotes);
      conn.off('UpdatedSummaryItems', handleUpdatedSummaryItems);
      conn.off('AllSummaryItems', handleAllSummaryItems);
      conn.off('Meeting', handleMeeting);
      conn.off('CurrentUser', handleCurrentUser);
      conn.off('ParticipantsChanged', handleParticipantsChanged);
      conn.off('AllAttendees', handleAttendance);
      conn.off('AllRelevantPeople', handleAllRelevantPeople);
      conn.off('MeetingToken', handleMeetingToken);
      conn.off('MeetingPhaseChangePending', handlePendingPhaseChange);
      conn.off('MeetingPhaseChangeCanceled', handleCanceledPhaseChange);
      conn.off('LeftMeeting', handleLeftMeeting);
      conn.off('Protocol', handleProtocolChange);
    };
  }, [navigate, hidePromoBar]);

  // Initialize stuff when the meeting changes
  useEffect(() => {
    meetingRef.current = meetingInfo.meeting;

    // TODO this does more coarse-grained requesting than I'd like. Ideally we activate this on meeting ID only.
    // But right now, editing a note doesn't broadcast changes to the associated summary item and vice versa.
    // This sidesteps that problem because every meeting phase-change re-requests everything. If we plan to
    // keep this approach for a while, could break it down a bit so we request only some of this stuff
    // based on phase.
    if (meetingInfo.meeting) {
      requestTopics();
      requestNotes();
      requestSummaryItems();
      requestRelevantPeople();
    }
  }, [meetingInfo]);

  useEffect(() => {
    // Request the list of services the user has linked to this account.
    fetchLinkedServices().then(services => setLinkedServices(services));
  }, [signInState]);

  // ================================================================================================
  //                                           TOPICS
  // ================================================================================================

  // Calculate derivative topics stuff when topic info changes
  useEffect(() => {
    if (!meetingInfo.meeting || !topics) {
      setCurrentTopicIndex(null);
      registerCurrentTopic(null);
    } else if (!meetingInfo.meeting.currentTopicId) {
      setCurrentTopicIndex(-1);
      registerCurrentTopic(null);
    } else {
      const idx = topics.findIndex(topic => topic.id === meetingInfo.meeting?.currentTopicId);
      setCurrentTopicIndex(idx);
      registerCurrentTopic(topics[idx]);
    }
  }, [meetingInfo, topics]);

  const getTopicById = useCallback(
    (topicId: string | null) => {
      if (!topicId) return null;

      return topics?.find(topic => topic.id === topicId) || null;
    },
    [topics]
  );

  // ================================================================================================
  //                                          MISC
  // ================================================================================================

  const handleChangePhaseAction = useCallback((phase: MeetingPhase, instant?: boolean) => {
    setPendingPhase({phase, changeTime: 'Waiting'});
    changeMeetingPhase_apiCallOnly(phase, instant);
  }, []);

  const values: MiterContextValues = {
    // Meeting data.
    meeting: meetingInfo.meeting,
    meetingError: meetingInfo.error,
    pendingPhase,
    handleChangePhaseAction,
    summaryItems,
    notes,
    topics,
    currentTopicIndex,
    currentTopic,
    getTopicById,
    participants,
    attendees,
    relevantPeople,

    // General.
    isInSidebar,
    wipFeature,

    // Authentication.
    currentUser,
    signInState,
    linkedServices,
    showSignInDialog,
    setShowSignInDialog,

    // Promo bar.
    isPromoBarVisible,
    hidePromoBar,
    currentPromo,
    showPromo,
  };

  return <MiterContext.Provider value={values}>{children}</MiterContext.Provider>;
};

export default MiterContextProvider;
