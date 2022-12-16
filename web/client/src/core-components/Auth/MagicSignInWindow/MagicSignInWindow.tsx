import {ReactNode} from 'react';
import {LogoLockupIcon} from 'image';
import {PrivacyNote} from 'core-components/Auth/PrivacyNote';
import './MagicSignInWindow.less';

interface MagicSignInWindowProps {
  title: string;
  children?: ReactNode;
}

const MagicSignInWindow: React.FC<MagicSignInWindowProps> = ({children, title}) => (
  <div className="MagicSignInWindow">
    <div className="MagicDialog">
      <a href="https://miter.co" target="miterhome" className="Title">
        <LogoLockupIcon />
      </a>
      <h1>{title}</h1>
      {children}
      <PrivacyNote />
    </div>
  </div>
);

export default MagicSignInWindow;
