import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Checkbox from 'basic-components/Checkbox';
import Avatar from 'basic-components/Avatar';
import {AddressBookPerson} from '../../../../../common/SharedTypes';
import './InviteColleagues.less';
import Button, {ButtonType} from 'basic-components/Button';
import {StrInviteColleagues} from 'miter-common/Strings';
import classNames from 'classnames';
import {useMiterContext} from 'model/MiterContextProvider';
import {copyShareUrlToClipboardAndConfirm} from 'Utils';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';
import {LinkIcon} from 'image';

interface InviteColleaguesProps {
  people: AddressBookPerson[];
  onCancel?: () => void;
  onShowMore?: () => void;
  isListExpanded?: boolean;
  onInvite: (invitedPeople: AddressBookPerson[]) => void;
  cancelBtnLabel: string;
}

type FlagMap = Record<string, boolean>;

// Number of colleagues shown in the collapsed list view.
const CollapsedListLength = 5;

const InviteColleagues: FC<InviteColleaguesProps> = ({
  people,
  onCancel,
  onInvite,
  onShowMore,
  cancelBtnLabel,
  isListExpanded,
}) => {
  const {meeting, currentUser, isInSidebar} = useMiterContext();
  const {hideInviteColleaguesModal} = useInviteColleaguesContext();
  const [isColleagueSelected, setIsColleagueSelected] = useState<FlagMap>({});
  const [colleagues, setColleagues] = useState<AddressBookPerson[]>([]);
  const isInMeetingContext = meeting && currentUser;
  const [selectedColleaguesCount, setSelectedColleagueCount] = useState(0);

  // Refresh the visible colleagues list depending on whether the list is expanded or not.
  useEffect(() => {
    if (isListExpanded || meeting) setColleagues(people);
    else setColleagues(people.slice(0, CollapsedListLength));
  }, [people, isListExpanded, meeting]);

  //--------------------------------------------------------------------------------------------------------------------
  //                                                BUTTON HANDLERS
  //--------------------------------------------------------------------------------------------------------------------
  const toggleSelection = useCallback((email: string) => {
    setIsColleagueSelected(prevState => {
      if (prevState[email]) {
        // It was selected, deselect it.
        setSelectedColleagueCount(prevCount => prevCount - 1);
      } else {
        // It wasn't selected, selecting it.
        setSelectedColleagueCount(prevCount => prevCount + 1);
      }

      return {
        ...prevState, // Keep the previous map values.
        [email]: !prevState[email], // And update the value for the given personId.
      };
    });
  }, []);

  const handleInviteSelected = useCallback(async () => {
    const selectedPeople = colleagues.filter(person => isColleagueSelected[person.email]);
    onInvite(selectedPeople);
  }, [colleagues, isColleagueSelected, onInvite]);

  const handleInviteAll = useCallback(async () => {
    onInvite(colleagues);
  }, [colleagues, onInvite]);

  const handleCopyLink = useCallback(() => {
    hideInviteColleaguesModal();
    copyShareUrlToClipboardAndConfirm();
  }, [hideInviteColleaguesModal]);

  //--------------------------------------------------------------------------------------------------------------------
  //                                            COMPONENT DOM STRUCTURE
  //--------------------------------------------------------------------------------------------------------------------
  const listItems = useMemo(() => {
    const items = colleagues.map(person => (
      <div className="ListItem" key={person.email}>
        <Checkbox
          checked={isColleagueSelected[person.email]}
          onChange={() => toggleSelection(person.email)}
          highlightEnabled
          label={
            <>
              <Avatar user={person} size={28} />
              {person.name && <div className="PersonName">{person.name || person.email}</div>}
              <div className={classNames('Email', {Highlighted: !person.name})}>{person.email}</div>
            </>
          }
        />
      </div>
    ));

    return items;
  }, [colleagues, isColleagueSelected, toggleSelection]);

  return (
    <div className="InviteColleagues">
      <h3 className="Title">{meeting ? 'Invite to Meeting ' : 'Invite Colleagues'}</h3>
      <p className="Instructions">
        {isInMeetingContext
          ? StrInviteColleagues.InviteMeetingColleaguesDescription
          : StrInviteColleagues.InviteColleaguesDescription}
      </p>

      <div className="ColleaguesList">
        {listItems}

        {!isListExpanded && people.length > CollapsedListLength && (
          <div className="ShowMoreBtn" onClick={onShowMore}>
            Show more...
          </div>
        )}

        {!colleagues.length && (
          <div className="EmptyListMessage">
            {isInMeetingContext
              ? StrInviteColleagues.EmptyMeetingColleaguesList
              : StrInviteColleagues.EmptyColleaguesList}
          </div>
        )}
      </div>

      <footer className="Footer">
        <Button
          className="SkipBtn"
          type={isInMeetingContext ? ButtonType.default : ButtonType.borderless}
          onClick={onCancel}
        >
          {cancelBtnLabel}
        </Button>

        {isInMeetingContext && (
          <Button
            className="CopyLinkBtn"
            type={ButtonType.default}
            onClick={handleCopyLink}
            icon={<LinkIcon />}
            title={StrInviteColleagues.CopyLinkTooltip}
          >
            {!isInSidebar && 'Copy Shareable Link'}
          </Button>
        )}

        <div className="RightSection">
          <Button type={ButtonType.default} onClick={handleInviteSelected} disabled={selectedColleaguesCount === 0}>
            Invite Selected
          </Button>
          <Button type={ButtonType.primary} onClick={handleInviteAll} disabled={colleagues.length === 0}>
            Invite All
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default InviteColleagues;
