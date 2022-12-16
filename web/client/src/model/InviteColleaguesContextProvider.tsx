import {createContext, useContext, useEffect, useState, FC, useCallback} from 'react';
import socket from 'SocketConnection';
import useBooleanSwitch from 'hooks/use-boolean-switch';
import {getUserPreference, setUserPreference} from './UserPrefs';
import {AddressBookPerson} from 'miter-common/SharedTypes';
import {useMiterContext} from './MiterContextProvider';
import {fetchUserAddressBook, sendInvites} from './UserApi';
import {Seconds} from 'miter-common/CommonUtil';
import {toast} from 'react-toastify';
import {fetchNonUsersFromInviteeList} from './MeetingApi';

const InviteColleaguesContext = createContext<InviteColleaguesContextValues | null>(null);
InviteColleaguesContext.displayName = 'Invite Colleagues Context';

const ToastOptions = {
  autoClose: 3 * Seconds,
  hideProgressBar: true,
  closeButton: false,
};

//----------------------------------------------------------------------------------------------------------------------
//                                         INVITE COLLEAGUES CONTEXT HOOK
//----------------------------------------------------------------------------------------------------------------------
export const useInviteColleaguesContext = (): InviteColleaguesContextValues => {
  const values = useContext(InviteColleaguesContext);
  if (!values) throw new Error('Attempted to use InviteColleaguesContext values outside a InviteColleaguesContext.');

  return values;
};

//----------------------------------------------------------------------------------------------------------------------
//                                             INVITE COLLEAGUES PROVIDER
//----------------------------------------------------------------------------------------------------------------------
interface InviteColleaguesContextValues {
  // Core component.
  colleagues: AddressBookPerson[];
  nonUserInvitees: AddressBookPerson[];
  setNonUserInvitees: (invitees: AddressBookPerson[]) => void;
  shouldShowMoreColleagues: boolean;
  expandColleaguesList: () => void;
  sendInviteEmail: (recipients: AddressBookPerson[]) => Promise<void>;
  fetchColleagues: () => Promise<void>;

  // Modal.
  shouldShowInviteColleaguesModal: boolean;
  showInviteColleaguesModal: () => void;
  hideInviteColleaguesModal: () => void;

  // CTA in task list.
  shouldShowInviteColleaguesCTA: boolean;
  hideInviteColleaguesCTA: () => void;
}

const InviteColleaguesContextProvider: FC = ({children}) => {
  const {meeting, attendees, currentUser} = useMiterContext();
  const [colleagues, setColleagues] = useState<AddressBookPerson[]>([]);
  const [nonUserInvitees, setNonUserInvitees] = useState<AddressBookPerson[]>([]);
  const [shouldShowMoreColleagues, expandColleaguesList, collapseColleaguesList] = useBooleanSwitch(false);
  const [shouldShowInviteColleaguesModal, showInviteColleaguesModal, hideInviteColleaguesModal] = useBooleanSwitch();
  const [shouldShowInviteColleaguesCTA, showInviteColleaguesCTA, hideInviteColleaguesCTA] = useBooleanSwitch(
    getUserPreference('ShowInviteColleaguesCTA')
  );

  //--------------------------------------------------------------------------------------------------------------------
  //                                                   ACTIONS
  //--------------------------------------------------------------------------------------------------------------------
  const fetchColleagues = useCallback(async () => {
    // Empty the Meeting Colleagues list until we fetch the non-users for the current meeting. Otherwise, when you open
    // a meeting, you get the non-users for that meeting and then, when you change to another meeting, for a short time
    // interval (the time between the `fetchNonUsersFromInviteeList` request and its response) the `nonUserInvitees`
    // variable will be populated with the non-users from the previous meeting. This would cause the PromoBar to be
    // shown suggesting you to invite colleagues that are not in the current meeting.
    setNonUserInvitees([]);

    if (!currentUser) return;
    if (meeting) fetchNonUsersFromInviteeList().then(setNonUserInvitees);
    else fetchUserAddressBook(20).then(setColleagues);
    collapseColleaguesList();
  }, [meeting, collapseColleaguesList, attendees, currentUser]); // eslint-disable-line

  // Send the colleague invite email.
  const sendInviteEmail = useCallback(
    async (people: AddressBookPerson[]) => {
      const recipients = people.map(({name, email}) => ({name, email}));
      setUserPreference('ShowInviteColleaguesCTA', false);
      hideInviteColleaguesModal();
      hideInviteColleaguesCTA();

      try {
        const {succeeded} = await sendInvites(recipients);
        toast.success(`${succeeded.length} invitations sent`, ToastOptions);
      } catch (error) {
        toast.error(`Failed to send the invitations`, ToastOptions);
      }
    },
    [hideInviteColleaguesCTA, hideInviteColleaguesModal]
  );

  //--------------------------------------------------------------------------------------------------------------------
  //                                               SOCKET MESSAGE HANDLERS
  //--------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    const handleLeftMeeting = () => {
      setNonUserInvitees([]);
    };

    const handleMeeting = () => {
      fetchColleagues();
    };

    socket.on('LeftMeeting', handleLeftMeeting);
    socket.on('Meeting', handleMeeting);

    // Fetch initial data.
    fetchColleagues();

    return () => {
      socket.off('LeftMeeting', handleLeftMeeting);
      socket.off('Meeting', handleMeeting);
    };
  }, [fetchColleagues]);

  //--------------------------------------------------------------------------------------------------------------------
  //                                              EXPORTED VALUES
  //--------------------------------------------------------------------------------------------------------------------
  const values: InviteColleaguesContextValues = {
    // Core component.
    colleagues,
    nonUserInvitees,
    setNonUserInvitees,
    shouldShowMoreColleagues,
    expandColleaguesList,
    sendInviteEmail,
    fetchColleagues,

    // Modal.
    shouldShowInviteColleaguesModal,
    showInviteColleaguesModal,
    hideInviteColleaguesModal,

    // CTA in task list.
    shouldShowInviteColleaguesCTA,
    hideInviteColleaguesCTA,
  };

  return <InviteColleaguesContext.Provider value={values}>{children}</InviteColleaguesContext.Provider>;
};

export default InviteColleaguesContextProvider;
