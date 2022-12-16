import {FC, useCallback} from 'react';
import {Modal} from 'antd';

import {InviteColleagues} from '../';
import {setUserPreference} from 'model/UserPrefs';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';
import {useMiterContext} from 'model/MiterContextProvider';
import './InviteColleaguesModal.less';

const InviteColleaguesModal: FC = () => {
  const {meeting, currentUser} = useMiterContext();
  const {
    hideInviteColleaguesModal,
    hideInviteColleaguesCTA,
    colleagues,
    nonUserInvitees,
    expandColleaguesList,
    sendInviteEmail,
    shouldShowMoreColleagues,
  } = useInviteColleaguesContext();

  const handleCancel = useCallback(() => {
    setUserPreference('ShowInviteColleaguesCTA', false);
    hideInviteColleaguesCTA();
    hideInviteColleaguesModal();
  }, [hideInviteColleaguesModal, hideInviteColleaguesCTA]);

  return (
    <Modal className="InviteColleaguesModal" visible footer={null} onCancel={hideInviteColleaguesModal}>
      <InviteColleagues
        people={meeting ? nonUserInvitees : colleagues}
        onShowMore={expandColleaguesList}
        isListExpanded={shouldShowMoreColleagues}
        onInvite={sendInviteEmail}
        onCancel={handleCancel}
        cancelBtnLabel={currentUser && meeting ? 'Cancel' : 'Skip'}
      />
    </Modal>
  );
};

export default InviteColleaguesModal;
