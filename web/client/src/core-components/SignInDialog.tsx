import {Modal} from 'antd';
import {useMiterContext} from 'model/MiterContextProvider';
import {useCallback, useEffect, useRef} from 'react';
import './SignInDialog.less';

const SignInDialog: React.FC = () => {
  const {showSignInDialog, setShowSignInDialog} = useMiterContext();
  const isSignedIn = useRef(false);

  const handleModalClosing = useCallback(() => {
    if (isSignedIn.current) window.location.reload();
    else setShowSignInDialog(false);
  }, [setShowSignInDialog]);

  // Handler for all events emitted by the welcome iframe.
  useEffect(() => {
    const handleIframeEvent = (event: MessageEvent) => {
      if (!event?.data.miter) return;

      switch (event?.data.type) {
        case 'FINISH_LOGIN': {
          isSignedIn.current = true;
          const loc = new URL(window.location.href);
          const search = new URLSearchParams(loc.search);
          search.delete('showSignIn');
          // Just doing a window.location.replace() call doesn't seem to do the trick on its own—the URL doesn't change.
          window.history.replaceState({}, '', `${loc.origin}${loc.pathname}${search.toString()}`);
          window.location.reload();
          break;
        }
        case 'HIDE_MODAL':
          handleModalClosing();
          break;
      }
    };

    window.addEventListener('message', handleIframeEvent);
    return () => window.removeEventListener('message', handleIframeEvent);
  }, [handleModalClosing]);

  return (
    <Modal
      className="SignInDialog"
      open={showSignInDialog}
      footer={null}
      closable={false}
      destroyOnClose
      maskClosable
      centered
      width={680}
      onCancel={handleModalClosing}
    >
      <iframe title="sign_in_window" src={`${window.HttpHost}/sign-in`} id="sign_in_iframe" />
    </Modal>
  );
};

export default SignInDialog;
