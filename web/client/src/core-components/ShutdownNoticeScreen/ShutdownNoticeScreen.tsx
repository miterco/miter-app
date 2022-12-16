import {postUnsafeMessageToParentWindow} from 'Utils';

// Components.
import {CloseIcon, LogoLockupDarkBareIcon} from 'image';

// Assets.
import '../Auth/StandardSignIn/StandardSignIn.less';
import './ShutdownNoticeScreen.less';
import {Shutdown} from 'miter-common/Strings';

// Note that we're sending the message to the parent frame without checking
// its origin, which in some circumstances could be a security risk. But
// in this case I don't think so: all we're saying is we want to hide the
// modal, which is already evident to anyone trying to poke at our app.
//
//
const closeModal = () => {
  localStorage.setItem('viewedSecondShutdownNoticeScreen', 'true');
  postUnsafeMessageToParentWindow({miter: true, type: 'HIDE_MODAL', payload: {}});
};

const ShutdownNoticeScreen: React.FC = () => {
  const isInIframe = window !== window.top;

  return (
    <div className="ModalNotice">
      <header>
        <LogoLockupDarkBareIcon className="Logo" />
        <h1>{Shutdown.ShortTitle}</h1>
        {isInIframe && (
          <button onClick={closeModal} className="CloseBtn">
            <CloseIcon />
          </button>
        )}
      </header>
      <div className="ContentScroll">
        <div className="Content">
          <p>
            <strong>{Shutdown.LongTitle}.</strong> {Shutdown.Description} {Shutdown.ChromeInstructions}
          </p>
          <div className="Buttons">
            <button
              className="Btn"
              onClick={() => {
                closeModal();
                window.open(Shutdown.ActionUrl, 'miterShutdownNotice');
              }}
            >
              <span>Learn More</span>
            </button>
            <button className="Btn" onClick={closeModal}>
              <span>OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShutdownNoticeScreen;
