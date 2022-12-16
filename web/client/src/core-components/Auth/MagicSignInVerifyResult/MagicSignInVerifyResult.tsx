// Third-party.
import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Spin} from 'antd';

// Components.
import {MagicSignInWindow} from 'core-components/Auth/MagicSignInWindow';
import {signInWithMagicLink} from 'model/MagicLinkApi';

import './MagicSignInVerifyResult.less';

interface MagicVerifyResultProps {}

const MagicVerifyResult: React.FC<MagicVerifyResultProps> = props => {
  const queryParams = new URLSearchParams(window.location.search);
  const code = queryParams.get('code') || null;
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<SignInState>('Pending');

  useEffect(() => {
    if (code) {
      signInWithMagicLink(code)
        .then(() => setAuthStatus('SignedIn'))
        .catch(_error => setAuthStatus('Error'));
    }
  }, [code]);

  const [title, bodyText, bodyClass, buttonLabel, buttonAction] = useMemo(() => {
    if (authStatus === 'SignedIn') {
      return [
        "You're All Set!",
        "That's it! Your account is ready and you can get started meeting in Miter.",
        undefined,
        'Start Mitering',
        () => window.location.assign('/app'),
      ];
    }

    return [
      authStatus === 'Pending' ? 'Verifying Code' : 'Verification Failed',
      <>
        Something went wrong. If you pasted the link in from your email, ensure you copied the whole thing. Otherwise,
        try signing in again; or <a href="https://miter.co/contact">contact us</a> if this keeps happening.
      </>,
      'Error',
      'Try Again',
      () => navigate('/sign-in/pwless'),
    ];
  }, [authStatus, navigate]);

  return (
    <MagicSignInWindow title={title}>
      {authStatus === 'Pending' ? (
        <Spin delay={150} />
      ) : (
        <div className="MagicVerify">
          <p className={bodyClass}>{bodyText}</p>
          <div className="Buttons">
            <button className="Btn" onClick={buttonAction}>
              {buttonLabel}
            </button>
          </div>
        </div>
      )}
    </MagicSignInWindow>
  );
};

export default MagicVerifyResult;
